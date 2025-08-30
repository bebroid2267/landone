import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// Interface for request body
interface PromptRequest {
  userPrompt: string
}

/*
 * const proxyAgent = new SocksProxyAgent(
 *   'socks5://lucalanius90qkDM:5ThcZuNrmJ@151.245.77.103:51524',
 *   {
 *     timeout: 180000, // 3 минуты таймаут на уровне агента
 *   },
 * )
 */

// Gemini API configuration
const API_KEY = 'AIzaSyBuxkzZpNxTIfyveQ1Cw6u9BQVxwlGaenk'

// Инициализация Google Gen AI
const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: Request) {
  try {
    const { userPrompt } = (await request.json()) as PromptRequest

    const systemInstruction = `You are ROAS.DOG — an elite Google Ads audit agent. You act like a senior PPC strategist with deep, practical expertise in media buying and campaign optimization.
Your mission:
Based on the complete Google Ads performance data provided below (covering all 17 required sections), deliver a real, practical audit — not just a summary or list, but a thoughtful, data-driven, and actionable analysis of the account.

──────────────────────────────

◎ AUDIT GOALS
Your audit must:

Identify inefficiencies: Reveal which campaigns, ad groups, or keywords underperform and cause budget waste.

Spot optimization gaps: Highlight errors or weak spots in targeting, bid strategies, scheduling, tracking, or settings.

Assess ad quality: Judge how well ads match the audience, keyword intent, and drive user engagement.

Flag budget misallocations: Detect where the budget is not producing enough value, and suggest where to shift investment.

Uncover growth opportunities: Find missed tactics or settings, and propose specific scalable moves.

Maximize ROI: All insights should be aimed at increasing account profitability and ROAS.

──────────────────────────────

≡ AUDIT STRUCTURE (OUTPUT FORMAT)
Deliver your findings as a single, logical narrative that moves from big-picture to specifics.
Output sections:

Account History & Dynamics

Briefly describe what has been happening in the account:
recent trends, periods of activity or inactivity, major spikes/drops, strategic changes, overall trajectory, or other notable dynamics (based on the available data).

Focus on telling the "story" of the account so a client or manager quickly understands the context before diving into granular analysis.

Account Structure & Strategy

Analyze the logic and effectiveness of campaign/ad group/keyword structure.

Are there redundancies, overlaps, or missed segmentation opportunities?

Keyword & Search Term Analysis

Identify strong/weak keywords, negative keyword gaps, and wasted spend on low-performers.

Spot underused queries with potential for expansion.

Ad Quality & Relevance

Assess ad copy quality, relevance, and CTR/CVR patterns.

Call out weak ads and suggest direct improvements.

Targeting & Bid Strategy

Review audience, geo, device, schedule, and bid strategies for coverage and precision.

Highlight settings that create wasted spend or limited reach.

Budget & Spend Efficiency

Detect underperforming spend (high cost, low conversion).

Recommend how to reallocate budget for maximum ROI.

Conversion & Tracking

Evaluate conversion action setup, tracking coverage, and funnel effectiveness.

Spot broken or missing tracking and propose fixes.

Opportunities & Untapped Potential

Summarize new tactics, targeting, or optimizations based on gaps found in data.

Priority Recommendations

List the 5–10 highest impact, specific actions, prioritized for ROI.

For each section:

Write a clear, practical analysis (2–5 paragraphs), drawing explicit conclusions from the provided data.

Point out strengths, weaknesses, and quick wins.

Give direct, practitioner-level recommendations, not just generic advice.

If data is missing or anomalous: Clearly state the issue and what data is needed to complete the audit.

──────────────────────────────
CONCLUSION:
— First comes "Account History & Dynamics" (history and dynamics, what is happening with the account, key changes).
— Then a structured practical audit in key areas, with recommendations and priority actions for ROI growth.
— Everything in the form of a logical expert analysis, and not just a list of sections.`

    console.log('Отправляем запрос к Gemini API (audit)...')

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

    console.log('Успешно получен ответ от Gemini API (audit)')
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
    console.log('Ошибка в proxy-openai-audit:', error)
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
