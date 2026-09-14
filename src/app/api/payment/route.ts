import { NextRequest, NextResponse } from 'next/server'

interface PaymentInitRequestBody {
  amount: number
  currency?: string
  description?: string
  customer?: {
    email?: string
    first_name?: string
    last_name?: string
    name?: string
    phone?: string
  }
  orderId?: string
  restaurantId?: string
  type?: 'subscription' | 'order'
  returnUrl?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentInitRequestBody = await request.json()
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
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Le montant du paiement est invalide.' }, { status: 400 })
    }

    const MONEROO_URL = process.env.MONEROO_URL || 'https://api.moneroo.io/v1/payments/initialize'
    const MONEROO_SECRET = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_SECRET || 'pvk_sandbox_xd3hbu|01KYSKY0QD9EM65FAXFVK2ZKN6'
    
    // Obtenir l'origine de la requête pour le return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const defaultReturnUrl = `${origin}/success`

    const isLiveKey = MONEROO_SECRET.startsWith('pvk_live_')
    
    // Dans Moneroo Live avec FedaPay, le XOF est géré directement en devise locale (ex: 5500 FCFA).
    // En sandbox de test Moneroo, certaines devises demandent USD ou une conversion de base.
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
      
      // Fallback sandbox pour devises incompatibles en mode test si nécessaire
      if (!isLiveKey && finalCurrency === 'XOF') {
        console.log('[Payment API] Tentative de fallback sandbox USD...')
        const fallbackAmount = Math.max(1, Math.round(finalAmount / 600))
        const fallbackResponse = await fetch(MONEROO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MONEROO_SECRET}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            ...payload,
            amount: fallbackAmount,
            currency: 'USD'
          })
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const checkoutUrl = fallbackData?.data?.checkout_url || fallbackData?.checkout_url || fallbackData?.data?.url || null
          const paymentId = fallbackData?.data?.id || fallbackData?.id || null
          return NextResponse.json({
            success: true,
            message: 'Paiement initié en sandbox',
            checkoutUrl,
            paymentId,
            fullData: fallbackData
          })
        }
      }

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
