import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId') || searchParams.get('id') || searchParams.get('token')

    if (!paymentId) {
      return NextResponse.json({ error: 'ID de paiement requis pour vérification.' }, { status: 400 })
    }

    const MONEROO_VERIFY_URL = process.env.MONEROO_VERIFY_URL || 'https://api.moneroo.io/v1/payments'
    const MONEROO_SECRET = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_SECRET || 'pvk_sandbox_xd3hbu|01KYSKY0QD9EM65FAXFVK2ZKN6'

    console.log(`[Payment Verify] Vérification du paiement ${paymentId} auprès de Moneroo...`)

    const response = await fetch(`${MONEROO_VERIFY_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MONEROO_SECRET}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`[Payment Verify] Erreur API Moneroo:`, response.status, err)
      return NextResponse.json({ 
        success: false, 
        status: 'unknown', 
        error: 'Impossible de vérifier auprès de la passerelle.' 
      }, { status: 200 })
    }

    const paymentData = await response.json()
    const p = paymentData?.data || paymentData

    const rawStatus = (p?.status || '').toLowerCase()
    const isPaid = rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'approved'
    const orderId = p?.metadata?.orderId
    const type = p?.metadata?.type || (orderId ? 'order' : 'subscription')
    const restaurantId = p?.metadata?.restaurantId

    const currencyCode = typeof p?.currency === 'object' ? (p?.currency?.code || 'XOF') : (p?.currency || 'XOF')

    // Si le paiement concerne une commande existante et est validé
    if (isPaid && orderId) {
      try {
        const existingOrder = await db.order.findUnique({
          where: { id: orderId }
        })

        if (existingOrder && existingOrder.paymentStatus !== 'paid') {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'paid',
              status: existingOrder.status === 'pending' ? 'confirmed' : existingOrder.status
            }
          })

          // Créer l'enregistrement de paiement s'il n'existe pas
          const existingPayment = await db.payment.findUnique({
            where: { orderId }
          })

          if (!existingPayment) {
            await db.payment.create({
              data: {
                orderId,
                restaurantId: existingOrder.restaurantId,
                amount: p.amount || existingOrder.total,
                currency: currencyCode,
                status: 'success',
                method: p.payment_method || 'mobile_money',
                transactionId: p.id || paymentId,
                provider: 'Moneroo / FedaPay',
                phone: p.customer?.phone || null
              }
            })
          }
          console.log(`[Payment Verify] Commande ${orderId} marquée comme payée avec succès.`)
        }
      } catch (dbErr) {
        console.error('[Payment Verify] Erreur mise à jour BDD commande:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      isPaid,
      status: isPaid ? 'success' : rawStatus || 'pending',
      amount: p?.amount,
      currency: currencyCode,
      customer: p?.customer,
      type,
      orderId,
      restaurantId,
      transactionId: p?.id || paymentId,
      metadata: p?.metadata
    })

  } catch (error: unknown) {
    console.error('[Payment Verify] Exception:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
