import { NextRequest, NextResponse } from 'next/server'

// Demo credentials
const DEMO_CREDENTIALS = {
  email: 'admin@restaurant.com',
  password: 'admin123',
  name: 'Admin Restaurant',
  role: 'restaurant_owner'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Check demo credentials
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      const user = {
        id: 'demo-user',
        email: DEMO_CREDENTIALS.email,
        name: DEMO_CREDENTIALS.name,
        role: DEMO_CREDENTIALS.role,
        restaurantId: 'demo-restaurant'
      }

      return NextResponse.json({ 
        success: true, 
        user,
        token: 'demo-token-' + Date.now()
      })
    }

    return NextResponse.json(
      { error: 'Email ou mot de passe incorrect' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}
