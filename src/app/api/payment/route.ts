import { NextRequest, NextResponse } from 'next/server'
import { paymentInitSchema } from '@/lib/validation'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/payment — initialisation d'un paiement Moneroo / FedaPay
//   - clé secrète UNIQUEMENT via variable d'environnement (aucun fallback en dur)
//   - montant validé par Zod, return_url restreint au domaine de l'app
// ============================================================================

function isAllowedReturnUrl(returnUrl: string, requestOrigin: string | null): boolean {
  try {
    const url = new URL(returnUrl)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const allowedHosts = new Set<string>()
    if (requestOrigin) {
      try { allowedHosts.add(new URL(requestOrigin).host) } catch { /* ignore */ }
    }
    if (appUrl) {
      try { allowedHosts.add(new URL(appUrl).host) } catch { /* ignore */ }
    }
    allowedHosts.add('localhost:3000')
    allowedHosts.add('127.0.0.1:3000')
    return allowedHosts.has(url.host)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // 20 initialisations / 10 min / IP
    const limit = rateLimit(getClientKey(request, 'payment:init'), 20, 10 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop de tentatives de paiement. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = paymentInitSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Demande de paiement invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }

    const {
      amount,
      currency = 'XOF',
      description,
      customer,
      orderId,
      restaurantId,
      type = 'order',
      returnUrl,
      metadata = {}
    } = parsed.data

    const MONEROO_URL = process.env.MONEROO_URL || 'https://api.moneroo.io/v1/payments/initialize'
    const MONEROO_SECRET = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_SECRET

    // ⚠️ Plus aucun fallback en dur : sans clé configurée, on refuse proprement.
    if (!MONEROO_SECRET) {
      console.error('[Payment API] MONEROO_SECRET_KEY non configuré.')
      return NextResponse.json(
        { error: 'Passerelle de paiement non configurée. Contactez l\'administrateur.' },
        { status: 503 }
      )
    }

    // Obtenir l'origine de la requête pour le return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const defaultReturnUrl = `${origin}/success`

    // return_url fourni par le client : doit pointer vers notre domaine
    if (returnUrl && !isAllowedReturnUrl(returnUrl, request.headers.get('origin'))) {
      return NextResponse.json({ error: 'returnUrl non autorisée.' }, { status: 400 })
    }

    const finalCurrency = currency.toUpperCase()
    const finalAmount = Math.round(Number(amount))

    // Formatter le client
    const customerEmail = customer?.email && customer.email.includes('@') ? customer.email : 'client@resto-saas.com'
    const customerFirstName = customer?.first_name || customer?.name?.split(' ')[0] || 'Client'
    const customerLastName = customer?.last_name || customer?.name?.split(' ').slice(1).join(' ') || 'RestoSaas'
    const customerPhone = customer?.phone || ''

    const payload = {
      amount: finalAmount,
      currency: finalCurrency,
      description: description || (type === 'subscription' ? 'Abonnement Zagoor RestoSaas' : `Commande ${orderId || 'Resto'}`),
      customer: {
        email: customerEmail,
        first_name: customerFirstName,
        last_name: customerLastName,
        phone: customerPhone
      },
      return_url: returnUrl || defaultReturnUrl,
      metadata: {
        ...metadata,
        type,
        orderId: orderId || null,
        restaurantId: restaurantId || null,
        createdVia: 'RestoSaas-Platform'
      }
    }

    console.log('[Payment API] Initialisation paiement Moneroo/FedaPay:', {
      amount: finalAmount,
      currency: finalCurrency,
      type,
      customerEmail
    })

    const response = await fetch(MONEROO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONEROO_SECRET}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Payment API] Erreur Moneroo:', response.status, errText)
      return NextResponse.json({ 
        error: 'Échec lors de l\'initialisation du paiement avec Moneroo / FedaPay.', 
        details: errText 
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('[Payment API] Réponse Moneroo avec succès:', data?.data?.id || data?.id)
    
    const checkoutUrl = data?.data?.checkout_url || data?.checkout_url || data?.checkoutUrl || data?.data?.url || data?.url || null
    const paymentId = data?.data?.id || data?.id || null

    return NextResponse.json({ 
      success: true, 
      message: 'Paiement initié avec succès', 
      checkoutUrl, 
      paymentId,
      fullData: data 
    })

  } catch (error: unknown) {
    console.error('[Payment API] Exception interne:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
