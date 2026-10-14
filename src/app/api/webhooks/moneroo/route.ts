import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// ============================================================================
// POST /api/webhooks/moneroo — webhooks Moneroo / FedaPay
//   SÉCURISÉ EN FAIL-CLOSED :
//   - signature HMAC-SHA256 exigée sur le corps brut (x-moneroo-signature)
//   - signature absente ou invalide → 401, JAMAIS traitée
//   - escape dev uniquement : WEBHOOK_ALLOW_UNSIGNED=true
//   - idempotence : ne marque payé qu'une fois
//   - vérification du montant avant marquage "paid"
// ============================================================================

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(computed)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature =
      request.headers.get('x-moneroo-signature') ||
      request.headers.get('x-signature') ||
      null

    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET
    const allowUnsigned =
      process.env.WEBHOOK_ALLOW_UNSIGNED === 'true' && process.env.NODE_ENV !== 'production'

    if (!webhookSecret) {
      if (!allowUnsigned) {
        console.error('[Webhook Moneroo] MONEROO_WEBHOOK_SECRET non configuré — webhooks rejetés.')
        return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 })
      }
      console.warn('[Webhook Moneroo] Traitement NON signé (développement uniquement).')
    } else {
      const authHeader = request.headers.get('authorization')
      const bearerOk = authHeader?.includes(webhookSecret) ?? false
      const signatureOk = verifySignature(rawBody, signature, webhookSecret)

      if (!signatureOk && !bearerOk) {
        // FAIL-CLOSED : signature absente ou invalide → rejet ferme
        console.warn('[Webhook Moneroo] Signature absente ou invalide — événement rejeté.')
        return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 })
      }
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
    // CORRECTION : les deux clés de métadonnées utilisées par le front
    const restaurantId = metadata?.restaurantId || metadata?.onboardingRestaurantId || null
    const type = metadata?.type || (orderId ? 'order' : 'subscription')

    if (isSuccess) {
      console.log(`[Webhook Moneroo] Paiement validé (${paymentData?.id || 'N/A'}) - Type: ${type}`)

      // Traitement Commande Restaurant
      if (orderId) {
        try {
          const order = await db.order.findUnique({
            where: { id: orderId }
          })

          if (order) {
            // Vérification du montant (tolérance sandbox : devise différente = log seulement)
            const gatewayAmount = Number(paymentData?.amount)
            const gatewayCurrency = typeof paymentData?.currency === 'object'
              ? (paymentData?.currency?.code || 'XOF')
              : (paymentData?.currency || 'XOF')
            const orderCurrency = order.currency || 'XOF'

            if (
              gatewayCurrency === orderCurrency &&
              Number.isFinite(gatewayAmount) &&
              Math.abs(gatewayAmount - order.total) > 1
            ) {
              console.warn(
                `[Webhook Moneroo] Montant divergent commande ${orderId}: gateway=${gatewayAmount} commande=${order.total} — marquage refusé.`
              )
              return NextResponse.json(
                { received: true, success: false, error: 'Montant divergent.' },
                { status: 400 }
              )
            }

            // Idempotence : déjà payé → ne rien faire
            if (order.paymentStatus !== 'paid') {
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
                    amount: gatewayAmount || order.total,
                    currency: gatewayCurrency,
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
          }
        } catch (dbErr) {
          console.error('[Webhook Moneroo] Erreur BDD mise à jour commande:', dbErr)
        }
      }

      // Activation SaaS Restaurant pour un abonnement payé
      if (type === 'subscription' && restaurantId) {
        try {
          await db.restaurant.update({
            where: { id: restaurantId },
            data: {
              isActive: true,
              plan: ['basic', 'pro', 'premium'].includes(metadata?.plan) ? metadata.plan : 'pro'
            }
          })
          console.log(`[Webhook Moneroo] Restaurant ${restaurantId} activé avec succès`)
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
