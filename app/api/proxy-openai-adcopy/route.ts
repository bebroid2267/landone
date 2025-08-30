import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

// Interface for request body
interface AdCopyRequest {
  product_service_description: string
  copy_style: string
}

interface AdCopyResponse {
  generated_ad_copies: {
    variation: number
    score: number
    headline: string
    body: string
  }[]
}

// Gemini API configuration
const API_KEY = 'AIzaSyBuxkzZpNxTIfyveQ1Cw6u9BQVxwlGaenk'

// Инициализация Google Gen AI
const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: Request) {
  try {
    const { product_service_description, copy_style } =
      (await request.json()) as AdCopyRequest

    // Системные инструкции для модели
    const systemInstruction = `You are an expert advertising copywriter and data‑driven marketer.

INPUTS I will supply every time:
• product_service_description – a short description of the product or service
• copy_style – the desired tone/voice (e.g., "professional", "playful", "technical")

YOUR TASK
Return **only** a valid JSON object with the exact schema below—no markdown, no extra text.

Schema:
{
  "generated_ad_copies": [
    {
      "variation": 1,            // integer, starts at 1
      "score": 0‑100,            // whole number quality score
      "headline": "string ≤ 60 characters, Title Case",
      "body": "string ≤ 140 characters, matches copy_style"
    },
    { ... }, { ... }            // exactly three variations total
  ]
}

Rules:
1. Produce exactly **3** variations per request.
2. Scores should range from 70–100, higher = better fit.
3. Headline separators may use "|" or "–" but keep length ≤ 60 chars.
4. Body text must stay within 140 characters.
5. Honor the requested copy_style in word choice, rhythm, and formality.
6. Output raw JSON only—no commentary or code fences.
7. Ensure the JSON is syntactically valid (quotation marks escaped if needed).`

    console.log(
      'Отправляем запрос к Gemini API для генерации рекламных копий...',
    )

    // Логирование в файл
    const logData = {
      timestamp: new Date().toISOString(),
      product_service_description,
      copy_style,
      systemInstruction: systemInstruction,
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(
      logDir,
      `gemini-adcopy-requests-${new Date().toISOString().split('T')[0]}.txt`,
    )
    const logEntry = `\n=== ${logData.timestamp} ===\n${JSON.stringify(
      logData,
      null,
      2,
    )}\n`

    try {
      fs.appendFileSync(logFile, logEntry)
    } catch (logError) {
      console.error('Ошибка записи в лог файл:', logError)
    }

    // Формируем промпт для Gemini
    const userPrompt = `product_service_description: "${product_service_description}"
copy_style: "${copy_style}"`

    // Используем новый Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    })

    const responseText = result.text

    if (!responseText) {
      throw new Error('No response from Gemini API')
    }

    // Очищаем ответ от markdown разметки если есть
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
    }

    // Парсим JSON ответ от Gemini
    let parsedResponse
    try {
      parsedResponse = JSON.parse(cleanedResponse) as AdCopyResponse
    } catch (parseError) {
      console.error('Ошибка парсинга JSON от Gemini:', parseError)
      console.error('Очищенный ответ от Gemini:', cleanedResponse)
      throw new Error('Invalid JSON response from Gemini API')
    }

    console.log('Успешно получен ответ от Gemini API для рекламных копий')
    return NextResponse.json(parsedResponse)
  } catch (error: unknown) {
    console.log('Ошибка в proxy-openai-adcopy:', error)
    console.error('Proxy error:', error)

    let errorMessage = 'Internal Server Error'
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = `Gemini API error: ${error.message}`
      statusCode = 502
    }

    return new NextResponse(errorMessage, { status: statusCode })
  }
}
