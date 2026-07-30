import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, customer, orderId, returnUrl } = body

    const MONEROO_URL = process.env.MONEROO_URL || 'https://api.moneroo.io/v1/payments/initialize'
    const MONEROO_SECRET = process.env.MONEROO_SECRET || 'pvk_sandbox_xd3hbu|01KYSKY0QD9EM65FAXFVK2ZKN6'
    const defaultReturnUrl = request.headers.get('origin') ? `${request.headers.get('origin')}/success` : 'https://resto-saas-roan.vercel.app/success'

    // Moneroo Sandbox requires USD or enabled currency
    const numAmount = Number(amount) || 1000
    const finalAmount = currency === 'XOF' ? Math.max(1, Math.round(numAmount / 600)) : numAmount
    const finalCurrency = currency === 'XOF' ? 'USD' : (currency || 'USD')

    // Appeler l'API Moneroo
    const response = await fetch(MONEROO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONEROO_SECRET}`
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: finalCurrency,
        description: description || 'Commande RestoSaas',
        customer: {
          email: (customer?.email && customer?.email.includes('@')) ? customer.email : 'client@resto-saas.com',
          first_name: customer?.first_name || customer?.name || 'Client',
          last_name: customer?.last_name || 'Client'
        },
        return_url: returnUrl || defaultReturnUrl,
        metadata: {
          orderId
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erreur Moneroo:', errText)
      return NextResponse.json({ error: 'Failed to initialize payment with Moneroo', details: errText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Moneroo API Response:", data)
    
    // Extrait l'URL de paiement Moneroo
    const checkoutUrl = data?.data?.checkout_url || data?.checkout_url || data?.checkoutUrl || data?.data?.url || data?.url || null

    return NextResponse.json({ 
      success: true,
      message: "Paiement initié",
      checkoutUrl,
      fullData: data 
    })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
