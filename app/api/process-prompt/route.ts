import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

interface PromptRequest {
  userPrompt: string
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function POST(request: Request) {
  try {
    const { userPrompt } = (await request.json()) as PromptRequest

    if (!userPrompt) {
      return new NextResponse('Prompt is required', { status: 400 })
    }

    // Get the host from headers
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

    const response = await fetch(`${protocol}://${host}/api/proxy-openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: userPrompt, // Отправляем userPrompt напрямую
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to process prompt')
    }

    const data = (await response.json()) as OpenAIResponse
    const processedPrompt = data.choices[0].message.content

    return NextResponse.json({
      success: true,
      processedPrompt,
    })
  } catch (error) {
    console.error('Error processing prompt:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
