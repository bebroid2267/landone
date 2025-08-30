import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

// Interface for request body
interface BudgetSimulationRequest {
  total_budget: number
  timeframe: string
  industry: string
  campaign_budget_allocation: {
    name: string
    budget: number
    budget_change_pct: string
    performance_change_note: string
  }[]
}

interface BudgetSimulationResponse {
  simulation_results: {
    estimated_clicks: number
    estimated_conversions: number
    estimated_revenue: string
    roi: string
  }
  key_metrics: {
    estimated_impressions: number
    average_cpc: string
    ctr: string
    conversion_rate: string
  }
}

// Gemini API configuration
const API_KEY = 'AIzaSyBuxkzZpNxTIfyveQ1Cw6u9BQVxwlGaenk'

// Инициализация Google Gen AI
const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { total_budget, timeframe, industry, campaign_budget_allocation } =
      (await request.json()) as BudgetSimulationRequest

    // Log the request for monitoring
    console.log('Отправляем запрос к Gemini API для симуляции бюджета...')

    // Логирование в файл
    const logData = {
      timestamp: new Date().toISOString(),
      total_budget,
      timeframe,
      industry,
      campaign_count: campaign_budget_allocation?.length || 0,
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(
      logDir,
      `gemini-budget-requests-${new Date().toISOString().split('T')[0]}.txt`,
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

    // Системные инструкции для модели
    const systemInstruction = `You are a Google Ads media‑buying analyst and forecasting specialist.

INPUTS I will give each time
• total_budget – numeric, in US dollars
• timeframe – plain string (e.g. "30 days", "Q4 2025")
• industry – short descriptor (e.g. "SaaS", "E‑commerce – Apparel")
• campaign_budget_allocation – an array of objects, each with:
    {
      "name": "Search" | "Display" | "Shopping" | ...,
      "budget": dollar amount,
      "budget_change_pct": percent vs. the current spend (may be ±),
      "performance_change_note": string describing the expected impact
    }

YOUR TASK
Return **only** a valid JSON object—no markdown, no commentary—following the exact schema below.

Schema
{
  "simulation_results": {
    "estimated_clicks": integer,                  // projected clicks
    "estimated_conversions": integer,             // projected conversions
    "estimated_revenue": "$number",               // revenue with $ and thousands separator if needed
    "roi": "+/-number%"                           // return on investment, rounded to whole %
  },
  "key_metrics": {
    "estimated_impressions": integer,             // total impressions
    "average_cpc": "$number.decimal",             // cost per click, dollar sign + 2 decimals
    "ctr": "number.decimal%",                     // click‑through rate, one or two decimals
    "conversion_rate": "number.decimal%"          // conversions ÷ clicks, same decimal rule
  }
}

Rules
1. Base all calculations on the provided budgets and deltas; use industry benchmarks where data is missing. Keep numbers proportionate and realistic.
2. Include **exactly** the fields above—nothing more, nothing less.
3. Format dollars with a leading "$", commas as thousands separators, and two decimals for CPC only.
4. Format all percentages with a "%" sign and at most one decimal, except ROI which is a whole percent.
5. Output must be valid JSON—no code fences, no explanations.`

    // Формируем промпт для Gemini
    const userPrompt = `total_budget: ${total_budget}
timeframe: "${timeframe}"
industry: "${industry}"
campaign_budget_allocation: ${JSON.stringify(
      campaign_budget_allocation,
      null,
      2,
    )}`

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
      parsedResponse = JSON.parse(cleanedResponse) as BudgetSimulationResponse
    } catch (parseError) {
      console.error('Ошибка парсинга JSON от Gemini:', parseError)
      console.error('Очищенный ответ от Gemini:', cleanedResponse)
      throw new Error('Invalid JSON response from Gemini API')
    }

    console.log('Успешно получен ответ от Gemini API для симуляции бюджета')
    return NextResponse.json(parsedResponse)
  } catch (error: unknown) {
    console.log('Ошибка в proxy-openai-budget:', error)
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
