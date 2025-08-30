import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

// Interface for request body
interface PromptRequest {
  userPrompt: string
}

// Interface for log data
interface LogData {
  timestamp: string
  systemInstruction: string[]
  userPrompt: string[]
  userPromptLength: number
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

**Constraint:** You MUST NOT include a direct call to action (e.g., “book a call,” “contact us”). The purpose is only to establish the need for human expertise and advanced tools.`

    console.log('Отправляем запрос к Gemini API для еженедельного анализа...')

    // Логирование в файл
    const logData = {
      timestamp: new Date().toISOString(),
      systemInstruction: systemInstruction.split('\n'),
      userPrompt: userPrompt.split('\n'),
      userPromptLength: userPrompt.length,
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(
      logDir,
      `gemini-requests-weekly-${new Date().toISOString().split('T')[0]}.json`,
    )

    // Читаем существующий файл или создаем пустой массив
    let existingLogs: LogData[] = []
    try {
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf8')
        existingLogs = JSON.parse(fileContent)
      }
    } catch (parseError) {
      console.error('Ошибка чтения лог файла:', parseError)
      existingLogs = []
    }

    /*
     * Проверяем на дублирование (если такой же userPrompt был в последние 10
     * секунд)
     */
    const now = new Date()
    const isDuplicate = existingLogs.some((log: LogData) => {
      const logTime = new Date(log.timestamp)
      const timeDiff = now.getTime() - logTime.getTime()
      return timeDiff < 10000 && log.userPromptLength === userPrompt.length
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
      model: 'gemini-2.5-pro',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    })

    const processedPrompt = result.text

    if (!processedPrompt) {
      throw new Error('No response from Gemini API')
    }

    console.log('Успешно получен ответ от Gemini API для еженедельного анализа')
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
    console.log('Ошибка в proxy-openai-weekly:', error)
    console.error('Weekly Proxy error:', error)

    let errorMessage = 'Internal Server Error'
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = `Gemini API error: ${error.message}`
      statusCode = 502
    }

    return new NextResponse(errorMessage, { status: statusCode })
  }
}
