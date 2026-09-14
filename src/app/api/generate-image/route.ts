import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Use the z-ai-web-dev-sdk to generate an image
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt: `${prompt}, professional food photography, appetizing, high quality`,
      size: '1024x1024'
    })

    const imageBase64 = response.data[0].base64
    const imageUrl = `data:image/png;base64,${imageBase64}`

    return NextResponse.json({ image: imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
