import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// ============================================================================
// GET /api/payment/verify — vérification d'un paiement auprès de Moneroo
//   - paymentId validé, rate-limité
//   - active le restaurant en cas d'abonnement payé
//     (CORRECTION : lit metadata.restaurantId OU metadata.onboardingRestaurantId ;
//      avant, l'activation ne se déclenchait JAMAIS car la clé ne correspondait pas)
//   - réponse minimisée (pas de PII client)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const limit = rateLimit(getClientKey(request, 'payment:verify'), 60, 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop de vérifications. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId') || searchParams.get('id') || searchParams.get('token')

    if (!paymentId || !/^[A-Za-z0-9_-]{4,120}$/.test(paymentId)) {
      return NextResponse.json({ error: 'ID de paiement requis pour vérification.' }, { status: 400 })
    }

    const MONEROO_VERIFY_URL = process.env.MONEROO_VERIFY_URL || 'https://api.moneroo.io/v1/payments'
    const MONEROO_SECRET = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_SECRET

    if (!MONEROO_SECRET) {
      return NextResponse.json(
        { success: false, status: 'unknown', error: 'Passerelle de paiement non configurée.' },
        { status: 503 }
      )
    }

    console.log(`[Payment Verify] Vérification du paiement ${paymentId} auprès de Moneroo...`)

    const response = await fetch(`${MONEROO_VERIFY_URL}/${encodeURIComponent(paymentId)}`, {
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
    // CORRECTION : les deux clés utilisées dans le code existant
    const restaurantId = p?.metadata?.restaurantId || p?.metadata?.onboardingRestaurantId || null

    const currencyCode = typeof p?.currency === 'object' ? (p?.currency?.code || 'XOF') : (p?.currency || 'XOF')

    // Si le paiement concerne une commande existante et est validé
    if (isPaid && orderId) {
      try {
        const existingOrder = await db.order.findUnique({
          where: { id: orderId }
        })

        if (existingOrder && existingOrder.paymentStatus !== 'paid') {
          // Vérification du montant quand la devise correspond
          const gatewayAmount = Number(p?.amount)
          if (
            currencyCode === (existingOrder.currency || 'XOF') &&
            Number.isFinite(gatewayAmount) &&
            Math.abs(gatewayAmount - existingOrder.total) > 1
          ) {
            console.warn(
              `[Payment Verify] Montant divergent pour la commande ${orderId}: gateway=${gatewayAmount} commande=${existingOrder.total}`
            )
          }

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

    // Activation du restaurant pour un abonnement payé
    if (isPaid && type === 'subscription' && restaurantId) {
      try {
        await db.restaurant.update({
          where: { id: restaurantId },
          data: {
            isActive: true,
            plan: p?.metadata?.plan && ['basic', 'pro', 'premium'].includes(p.metadata.plan)
              ? p.metadata.plan
              : 'pro'
          }
        })
        console.log(`[Payment Verify] Restaurant ${restaurantId} activé (abonnement ${type}).`)
      } catch (subErr) {
        console.error('[Payment Verify] Erreur activation restaurant:', subErr)
      }
    }

    return NextResponse.json({
      success: true,
      isPaid,
      status: isPaid ? 'success' : rawStatus || 'pending',
      amount: p?.amount,
      currency: currencyCode,
      type,
      orderId: orderId || null,
      restaurantId: restaurantId || null,
      transactionId: p?.id || paymentId,
    })

  } catch (error: unknown) {
    console.error('[Payment Verify] Exception:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
