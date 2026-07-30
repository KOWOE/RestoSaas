import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, customer, orderId, returnUrl } = body

    const MONEROO_URL = 'https://hooks.moneroo.io/ho_7rd8rwv2083s'
    const MONEROO_SECRET = 'ih_01KYQX8F6XYP5482DCT1XSBEA7_ccmy2l0a4gyk_RNbbQBsyOcAw'

    // Appeler le webhook Moneroo
    const response = await fetch(MONEROO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONEROO_SECRET}`
      },
      body: JSON.stringify({
        amount,
        currency: currency || 'XOF',
        description,
        customer,
        return_url: returnUrl || 'http://localhost:3000',
        metadata: {
          orderId
        }
      })
    })

    if (!response.ok) {
      console.error('Erreur Moneroo:', await response.text())
      return NextResponse.json({ error: 'Failed to initialize payment with Moneroo' }, { status: response.status })
    }

    const data = await response.json()
    console.log("Moneroo Webhook Response:", data)
    
    return NextResponse.json({ 
      success: true,
      message: "Paiement initié",
      fullData: data 
    })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
