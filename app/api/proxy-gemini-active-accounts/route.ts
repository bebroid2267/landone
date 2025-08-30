import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

// Interface for request body
interface ActiveAccountsRequest {
  accountsData: Record<string, {
    account_activity_last_30d: {
      cost: number
      clicks: number
      campaigns: string[]
      domains: string[]
    }
  }>
}

// Interface for log data
interface LogData {
  timestamp: string
  systemInstruction: string[]
  userPrompt: string[]
  accountsCount: number
}

// Gemini API configuration
const API_KEY = 'AIzaSyBuxkzZpNxTIfyveQ1Cw6u9BQVxwlGaenk'

// Инициализация Google Gen AI
const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: Request) {
  try {
    const { accountsData } = (await request.json()) as ActiveAccountsRequest

    // Системные инструкции для модели
    const systemInstruction = `You are an expert Google Ads account activity analyzer.

## PRIMARY OBJECTIVE  
Analyze the provided Google Ads accounts activity data for the last 30 days and determine which accounts are ACTIVE.

## ANALYSIS CRITERIA
An account is considered ACTIVE if it meets ANY of these conditions:
- Cost > 0 (has spent money in the last 30 days)
- Clicks > 50 (has meaningful traffic)
- Has active campaigns (campaigns array is not empty)
- Has landing page domains (domains array is not empty)

## OUTPUT FORMAT
You MUST return a valid JSON object with the following structure:
{
  "active_accounts": ["account_id_1", "account_id_2", "account_id_3"],
  "analysis_summary": {
    "total_accounts_analyzed": number,
    "active_accounts_count": number,
    "inactive_accounts_count": number
  }
}

## IMPORTANT RULES
- Return ONLY valid JSON, no additional text or explanations
- Include account ID in active_accounts array if it meets ANY of the activity criteria
- Be precise with the counts in analysis_summary
- If an account has zero activity across all metrics (cost = 0, clicks = 0, campaigns = [], domains = []), it is INACTIVE`

    console.log('Отправляем запрос к Gemini API для анализа активности аккаунтов...')

    const userPrompt = `Analyze the following Google Ads accounts activity data for the last 30 days:

${JSON.stringify(accountsData, null, 2)}

Determine which account IDs are ACTIVE based on the criteria provided.`

    // Логирование в файл
    const logData = {
      timestamp: new Date().toISOString(),
      systemInstruction: systemInstruction.split('\n'),
      userPrompt: userPrompt.split('\n'),
      accountsCount: Object.keys(accountsData).length,
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(
      logDir,
      `gemini-requests-active-accounts-${new Date().toISOString().split('T')[0]}.json`,
    )

    // Читаем существующий файл или создаем пустой массив
    let existingLogs: LogData[] = []
    try {
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf8')
        existingLogs = JSON.parse(fileContent) as LogData[]
      }
    } catch (parseError) {
      console.error('Ошибка чтения лог файла:', parseError)
      existingLogs = []
    }

    // Проверяем на дублирование (если такое же количество аккаунтов было в последние 10 секунд)
    const now = new Date()
    const isDuplicate = existingLogs.some((log: LogData) => {
      const logTime = new Date(log.timestamp)
      const timeDiff = now.getTime() - logTime.getTime()
      return timeDiff < 10000 && log.accountsCount === Object.keys(accountsData).length
    })

    // Добавляем новую запись только если это не дубликат
    if (!isDuplicate) {
      existingLogs.push(logData)

      try {
        fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2))
      } catch (logError) {
        console.error('Ошибка записи в лог файл:', logError)
      }
    } else {
      console.log('Дубликат запроса обнаружен, запись в лог пропущена')
    }

    // Используем новый Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    })

    const response = result.text

    if (!response) {
      throw new Error('No response from Gemini API')
    }

    console.log('Успешно получен ответ от Gemini API')
    
    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = response.trim()
    
    // Remove markdown code blocks (```json and ```)
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    console.log('Cleaned Gemini response:', cleanedResponse)
    
    // Parse the JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse cleaned Gemini response as JSON:', cleanedResponse)
      console.error('Parse error:', parseError)
      throw new Error('Invalid JSON response from Gemini API')
    }

    return NextResponse.json(parsedResponse)
    
  } catch (error: unknown) {
    console.log('Ошибка в proxy-gemini-active-accounts:', error)
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