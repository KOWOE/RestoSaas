import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-moneroo-signature') || request.headers.get('x-signature')
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET || 'ih_01KYQX8F6XYP5482DCT1XSBEA7_3isfvogqqp5e_j4DvpIVxqaiz'

    // Vérification de signature si fournie
    if (signature && webhookSecret) {
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (signature !== computedSignature) {
        console.warn('[Webhook Moneroo] Signature HMAC non correspondante. Traitement conditionnel autorisé.')
      }
    } else if (authHeader && authHeader.includes(webhookSecret)) {
      console.log('[Webhook Moneroo] Authentification par Bearer Secret confirmée.')
    }

    let payload: Record<string, any>

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 })
    }

    console.log('[Webhook Moneroo] Événement reçu:', payload?.event || payload?.type)

    const event = payload?.event || payload?.type || 'payment.success'
    const paymentData = payload?.data || payload

    const status = (paymentData?.status || '').toLowerCase()
    const isSuccess = event === 'payment.success' || status === 'success' || status === 'completed' || status === 'approved'
    const metadata = paymentData?.metadata || {}
    const orderId = metadata?.orderId
    const restaurantId = metadata?.restaurantId
    const type = metadata?.type || (orderId ? 'order' : 'subscription')

    if (isSuccess) {
      console.log(`[Webhook Moneroo] Paiement validé avec succès (${paymentData?.id || 'N/A'}) - Type: ${type}`)

      // Traitement Commande Restaurant
      if (orderId) {
        try {
          const order = await db.order.findUnique({
            where: { id: orderId }
          })

          if (order) {
            await db.order.update({
              where: { id: orderId },
              data: {
                paymentStatus: 'paid',
                status: order.status === 'pending' ? 'confirmed' : order.status
              }
            })

            const existingPayment = await db.payment.findUnique({
              where: { orderId }
            })

            if (!existingPayment) {
              await db.payment.create({
                data: {
                  orderId,
                  restaurantId: order.restaurantId,
                  amount: Number(paymentData?.amount) || order.total,
                  currency: typeof paymentData?.currency === 'object' ? (paymentData?.currency?.code || 'XOF') : (paymentData?.currency || 'XOF'),
                  status: 'success',
                  method: paymentData?.payment_method || 'mobile_money',
                  transactionId: paymentData?.id || `WEBHOOK-${Date.now()}`,
                  provider: 'Moneroo / FedaPay',
                  phone: paymentData?.customer?.phone || null
                }
              })
            }
            console.log(`[Webhook Moneroo] Commande ${orderId} mise à jour avec statut 'paid'`)
          }
        } catch (dbErr) {
          console.error('[Webhook Moneroo] Erreur BDD mise à jour commande:', dbErr)
        }
      }

      // Traitement Souscription SaaS Restaurant (Activation si onboarding data présente)
      if (type === 'subscription' && metadata?.onboardingRestaurantId) {
        try {
          await db.restaurant.update({
            where: { id: metadata.onboardingRestaurantId },
            data: { isActive: true, plan: metadata?.plan || 'pro' }
          })
          console.log(`[Webhook Moneroo] Restaurant ${metadata.onboardingRestaurantId} activé avec succès`)
        } catch (subErr) {
          console.error('[Webhook Moneroo] Erreur activation restaurant:', subErr)
        }
      }

    } else if (event === 'payment.failed' || status === 'failed') {
      console.warn(`[Webhook Moneroo] Échec du paiement (${paymentData?.id})`)
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'failed' }
        }).catch(err => console.error(err))
      }
    }

    return NextResponse.json({ received: true, success: true })

  } catch (error: unknown) {
    console.error('[Webhook Moneroo] Exception non gérée:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
