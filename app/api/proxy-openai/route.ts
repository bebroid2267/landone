import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Interface for request body
interface PromptRequest {
  userPrompt: string
}

// Interface for log data - simplified
interface LogData {
  timestamp: string
  systemInstruction: string[]
  userPrompt: string[]
  userPromptLength: number
  userPromptHash: string
}

// Gemini API configuration
const API_KEY = 'AIzaSyBuxkzZpNxTIfyveQ1Cw6u9BQVxwlGaenk'

// Инициализация Google Gen AI
const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: Request) {
  try {
    const { userPrompt } = (await request.json()) as PromptRequest

    // Системные инструкции для модели
    const systemInstruction = `You are **ROAS.DOG** — a world‑class Google Ads strategist focused exclusively on profitability.

---

## PRIMARY OBJECTIVE  
Craft a persuasive strategic audit for a C‑level executive in a structured format with numbered sections.  
Start with the most obvious problems to someone who is *not* managing the accounts himself.

## FORMAT REQUIREMENTS
- Use numbered sections (1., 2., 3., etc.)
- Each section must have a clear, descriptive title
- Structure each section exactly as: **Problem → Why This is a Problem → Resolution**
- Include specific data points and metrics when available
- Use clear headings and sub‑headings
- Present actionable recommendations
- Add a **complexity flag** for each problem/section

### COMPLEXITY FLAG
- **Complexity:** hard  — manual analysis, complex strategy, deep expertise  
- **Complexity:** easy  — straightforward issue, automated solution

## STRUCTURE TEMPLATE
# Google Ads Account Audit Report

## 1. The [Specific Problem Name]: [Brief Strategic Description]

**Complexity:** [hard/easy]

**The Problem:** [Clear statement of the issue with specific details]

**Why This is a Problem:** [Explanation of impact with data and metrics]

**Resolution:**  
- **Immediate Action:** [Specific actionable steps]  
- **Rationale:** [Why this solution will work with expected outcomes]

[Include relevant data tables, campaign names, and specific metrics]

## 2. The [Next Specific Problem Name]: [Brief Strategic Description]

*(Continue the same format for all identified problems…)*

Tone: Authoritative, direct, professional. Justify all recommendations with unassailable logic. Convince the client of your superior expertise.

---

## FINAL SECTION DIRECTIVE  
At the end of **every** audit, you MUST add a final section titled:

### Conclusion: Automated Diagnosis vs. Human Strategy

This section must contain **exactly three paragraphs**, following this logic:

1. **Define Your AI Limitation** — state that true profit scaling requires forward‑looking strategy that models LTV, CAC, and the competitive landscape. Explicitly define your function as identifying *correlation*, while a human strategist’s function is to determine *causation*.  
2. **Emphasise Human Insight** — explain that interpreting causation and prioritising actions amid business constraints is the domain of an experienced strategist.  
3. **Introduce the Human’s Superior Tools** — conclude that complex architectural work (such as a full account restructure) is best handled with our proprietary **“Causation & Impact Analysis”** framework to ensure long‑term profitability.

**Constraint:** You MUST NOT include a direct call to action (e.g., “book a call,” “contact us”). The purpose is only to establish the need for human expertise and advanced tools.
`
    console.log('Отправляем запрос к Gemini API...')

    // Создаем hash от userPrompt для надежной детекции дубликатов
    const userPromptHash = crypto
      .createHash('md5')
      .update(userPrompt)
      .digest('hex')

    // Логирование в файл
    const logData = {
      timestamp: new Date().toISOString(),
      systemInstruction: systemInstruction.split('\n'),
      userPrompt: userPrompt.split('\n'),
      userPromptLength: userPrompt.length,
      userPromptHash,
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(
      logDir,
      `gemini-requests-${new Date().toISOString().split('T')[0]}.json`,
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

    /*
     * Simplified: No duplicate detection needed since frontend prevents
     * multiple calls
     */
    console.log('Обрабатываем запрос к Gemini API...')
    const now = new Date()

    // Добавляем новую запись
    existingLogs.push(logData)

    // Очищаем старые записи (старше 24 часов) чтобы файл не разрастался
    const cutoffTime = now.getTime() - 24 * 60 * 60 * 1000
    existingLogs = existingLogs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime()
      return logTime > cutoffTime
    })

    try {
      fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2))
    } catch (logError) {
      console.error('Ошибка записи в лог файл:', logError)
    }

    // Retry логика для Gemini API с экспоненциальной задержкой
    const MAX_RETRIES = 3
    const BASE_DELAY = 2000 // 2 секунды базовая задержка (увеличено для rate limiting)

    let result = null
    let lastError = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 Попытка ${attempt}/${MAX_RETRIES}: Отправляем запрос к Gemini API...`,
        )

        result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemInstruction,
          },
        })

        console.log(
          `✅ Попытка ${attempt}/${MAX_RETRIES}: Успешно получен ответ от Gemini API`,
        )
        break // Успешно получили результат, выходим из цикла
      } catch (error) {
        lastError = error
        console.error(
          `❌ Попытка ${attempt}/${MAX_RETRIES} провалилась:`,
          error instanceof Error ? error.message : String(error),
        )

        if (attempt === MAX_RETRIES) {
          console.error(
            `❌ Все ${MAX_RETRIES} попытки провалились, выбрасываем ошибку`,
          )
          throw error // Последняя попытка - выбрасываем ошибку
        }

        // Увеличенная задержка для rate limiting ошибок
        let delay = BASE_DELAY * Math.pow(2, attempt - 1)

        // Если это rate limiting ошибка, увеличиваем задержку
        const errorMessage =
          error instanceof Error
            ? error.message.toLowerCase()
            : String(error).toLowerCase()
        if (
          errorMessage.includes('rate') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('limit')
        ) {
          delay = delay * 3 // Увеличиваем задержку в 3 раза для rate limiting
          console.log(`⚠️ Обнаружена ошибка rate limiting, увеличена задержка`)
        }

        console.log(`⏳ Ждем ${delay}ms перед следующей попыткой...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // Правильное извлечение текста из Gemini API response
    let processedPrompt = null

    // Попробуем извлечь текст разными способами
    if (result?.text) {
      processedPrompt = result.text
    } else if (result?.candidates?.[0]?.content?.parts?.length) {
      const parts = result.candidates[0].content.parts
      const text = parts
        .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
        .join('')
        .trim()
      if (text) {
        processedPrompt = text
      }
    }

    console.log('📥 Получили результат от Gemini API:', {
      hasResult: !!result,
      hasText: !!processedPrompt,
      resultKeys: result ? Object.keys(result) : [],
      candidatesCount: result?.candidates?.length || 0,
      firstCandidateKeys: result?.candidates?.[0]
        ? Object.keys(result.candidates[0])
        : [],
      contentKeys: result?.candidates?.[0]?.content
        ? Object.keys(result.candidates[0].content)
        : [],
      hasParts: !!result?.candidates?.[0]?.content?.parts,
      partsCount: result?.candidates?.[0]?.content?.parts?.length || 0,
      finishReason: result?.candidates?.[0]?.finishReason,
      resultText: processedPrompt
        ? processedPrompt.substring(0, 200) + '...'
        : 'NO TEXT',
    })

    if (!processedPrompt) {
      console.error('❌ ПОЛНАЯ ИНФОРМАЦИЯ О ПУСТОМ ОТВЕТЕ ОТ GEMINI:')
      console.error('Result object:', JSON.stringify(result, null, 2))
      console.error('Result.text:', result?.text)
      console.error('Result type:', typeof result)
      console.error(
        'Result keys:',
        result ? Object.keys(result) : 'result is null/undefined',
      )
      console.error('Candidates:', result?.candidates)
      console.error(
        'First candidate content:',
        result?.candidates?.[0]?.content,
      )
      console.error('Finish reason:', result?.candidates?.[0]?.finishReason)
      throw new Error('No response from Gemini API')
    }

    /*
     * Simplified: No result caching needed since duplicates are prevented at
     * frontend
     */
    console.log('✅ Результат готов для отправки')

    return NextResponse.json({
      choices: [
        {
          message: {
            content: processedPrompt,
          },
        },
      ],
    })
  } catch (error: unknown) {
    console.error('❌ ПОЛНАЯ ОШИБКА В PROXY-OPENAI:')
    console.error('Error type:', typeof error)
    console.error('Error instanceof Error:', error instanceof Error)
    console.error('Error object:', error)
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    )
    console.error(
      'Error message:',
      error instanceof Error ? error.message : 'No error message',
    )
    console.error('Error toString:', String(error))
    console.error(
      'Error JSON:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    )

    let errorMessage = 'Internal Server Error'
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = `Gemini API error: ${error.message}`
      statusCode = 502
    }

    return new NextResponse(errorMessage, { status: statusCode })
  }
}
