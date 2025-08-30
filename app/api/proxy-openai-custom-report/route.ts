import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

// Interface for request body
interface PromptRequest {
  userPrompt: string
  accountId?: string
  timeRange?: string
  accessToken?: string
  campaignId?: string
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
    const { userPrompt, accountId, timeRange, accessToken: requestAccessToken, campaignId } = (await request.json()) as PromptRequest

    // Get access token from request body first, then fallback to cookies
    const cookieHeader = request.headers?.get('cookie') ?? ''
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)

    // Try to get access token from request body first, then various possible cookie names
    const accessToken = requestAccessToken || 
                       cookies['google-ads-access-token'] || 
                       cookies['access-token'] || 
                       cookies['token'] ||
                       request.headers?.get('authorization')?.replace('Bearer ', '')
    
    console.log('Access token found:', !!accessToken)
    console.log('Available cookies:', Object.keys(cookies))

    // Системные инструкции для модели
    const systemInstruction = `Role & Positioning
You are ROAS.DOG — a world‑class Google Ads strategist and data analyst laser‑focused on profitability and actionable insights.

PRIMARY OBJECTIVE
Generate a comprehensive custom report specifically answering the focus question provided by the user (e.g. “Are my keywords high quality?”). Centre every analysis, metric and recommendation on this focal topic while still flagging any critical ancillary issues uncovered.

HOW THE USER SETS THE FOCUS
The user opens the conversation with a short, plain‑language question or request naming the precise aspect of their Google Ads account they want scrutinised.

Treat that text as [USER_FOCUS] and weave it explicitly into each section of the report.

If the question is ambiguous, politely ask for one clarification, then proceed.

FORMAT REQUIREMENTS
Clear, structured formatting with numbered sections

Use the report structure template below, inserting [USER_FOCUS] where indicated

Cite concrete data points & relevant KPIs

Provide specific, implementable recommendations tied to ROI/business impact

Tone: professional, authoritative, data‑driven

REPORT STRUCTURE TEMPLATE
Custom Google Ads Report — Focus: [USER_FOCUS]
Executive Summary
Brief overview of how the analysis answers [USER_FOCUS], key findings, and top recommendations.

1. Analysis Overview
Scope: Elements examined to address [USER_FOCUS]
Primary Focus Question: [USER_FOCUS]
Key Metrics: Relevant KPIs & benchmarks tied to the focus
Time Period: Analysis timeframe

2. Key Findings
For each major insight that affects [USER_FOCUS]:

Finding 1 — [concise title]:


Impact: Why this matters to the focus question

Evidence: Supporting data/metrics

(Repeat for additional findings.)

3. Opportunities & Recommendations
Immediate Actions (0‑7 days) – directly improving [USER_FOCUS]
[Action Item]

Expected Impact: Quantified benefit on focus KPI(s)

Implementation: Concrete steps

Resources Required: Time/budget

Short‑term Optimisations (1‑4 weeks)
[Optimisation] – Rationale & expected results

Long‑term Strategy (1‑3 months)
[Strategic Initiative] – Business case & high‑level roadmap

4. Risk Assessment (relative to [USER_FOCUS])
High Priority Risks

Medium Priority Risks

Monitoring Points (KPIs to track)

5. Next Steps
Prioritised action items keyed to [USER_FOCUS]

Follow‑up recommendations

Monitoring & measurement plan

Usage example
User: I want to find out how high-quality my keywords are?”
Model (using template above) builds a report focused on keyword quality, detailing search term relevance, Quality Score distribution, wasted‑spend keywords, match‑type efficiency, etc., and delivers targeted recommendations to improve keyword quality and profitability.
`
    // Если предоставлены accountId и timeRange, собираем данные Google Ads
    let finalUserPrompt = userPrompt
    
    if (accountId && timeRange && accessToken) {
      console.log('Собираем данные Google Ads для кастомного отчета...')
      
      const host = request.headers?.get('host')
      const protocol = request.headers?.get('x-forwarded-proto') ?? 'http'
      const baseUrl = host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

      const cookieHeader = request.headers?.get('cookie') ?? ''

      try {
        const [
          conversionActionSetupResponse,
          campaignStructureOverviewResponse,
          keywordMatchTypeMixResponse,
          adGroupThemingResponse,
          zeroConversionKeywordsResponse,
          performanceByNetworkResponse,
          searchTermAnalysisResponse,
          changeHistorySummaryResponse,
          performanceMaxDeepDiveResponse,
          landingPagePerformanceResponse,
          adCopyTextResponse,
          geoHotColdResponse,
        ] = await Promise.all([
          fetch(`${baseUrl}/api/google-ads/conversion-action-setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/campaign-structure-overview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/keyword-match-type-mix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/ad-group-theming`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/zero-conversion-keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/performance-by-network`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/search-term-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/change-history-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/performance-max-deep-dive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/landing-page-performance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/ad-copy-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
          fetch(`${baseUrl}/api/google-ads/geo-hot-cold`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({ 
              accessToken, 
              accountId, 
              timeRange,
              campaignId 
            }),
          }),
        ])

        // Проверяем успешность всех запросов
        if (
          !conversionActionSetupResponse.ok ||
          !campaignStructureOverviewResponse.ok ||
          !keywordMatchTypeMixResponse.ok ||
          !adGroupThemingResponse.ok ||
          !zeroConversionKeywordsResponse.ok ||
          !performanceByNetworkResponse.ok ||
          !searchTermAnalysisResponse.ok ||
          !changeHistorySummaryResponse.ok ||
          !performanceMaxDeepDiveResponse.ok ||
          !landingPagePerformanceResponse.ok ||
          !adCopyTextResponse.ok ||
          !geoHotColdResponse.ok
        ) {
          console.warn('Some Google Ads endpoints failed, proceeding with user prompt only')
        } else {
          // Получаем данные из всех ответов
          const [
            conversionActionSetupData,
            campaignStructureOverviewData,
            keywordMatchTypeMixData,
            adGroupThemingData,
            zeroConversionKeywordsData,
            performanceByNetworkData,
            searchTermAnalysisData,
            changeHistorySummaryData,
            performanceMaxDeepDiveData,
            landingPagePerformanceData,
            adCopyTextData,
            geoHotColdData,
          ] = await Promise.all([
            conversionActionSetupResponse.json(),
            campaignStructureOverviewResponse.json(),
            keywordMatchTypeMixResponse.json(),
            adGroupThemingResponse.json(),
            zeroConversionKeywordsResponse.json(),
            performanceByNetworkResponse.json(),
            searchTermAnalysisResponse.json(),
            changeHistorySummaryResponse.json(),
            performanceMaxDeepDiveResponse.json(),
            landingPagePerformanceResponse.json(),
            adCopyTextResponse.json(),
            geoHotColdResponse.json(),
          ])

          // Формируем данные аналогично full audit
          const formatBlock1Data = () => {
            return {
              campaign_overview: campaignStructureOverviewData.campaign_overview,
              match_type_overview: keywordMatchTypeMixData.match_type_overview
            };
          };

          const googleAdsData = `
# Google Ads Account Analysis

## Block 1: Campaign Foundation Analysis
${JSON.stringify(formatBlock1Data(), null, 2)}

## Block 2: Ad Group Theming Analysis
${JSON.stringify({
  ad_group_theming: {
    headers: ["campaignName", "adGroupName", "keywordCount", "cost", "roas", "topKeywords"],
    rows: adGroupThemingData.campaigns?.flatMap((campaign: { campaignName: string; ad_group_summary?: Array<{ adGroupName: string; keywordCount: number; cost: number; roas: number; top_spending_keywords_sample?: string[] }> }) =>
      campaign.ad_group_summary?.map(adGroup => [
        campaign.campaignName,
        adGroup.adGroupName,
        adGroup.keywordCount,
        Math.round(adGroup.cost * 100) / 100,
        Math.round(adGroup.roas * 100) / 100,
        adGroup.top_spending_keywords_sample?.join(", ") || ""
      ]) || []
    ) || []
  }
}, null, 2)}

## Block 3: Zero Conversion Keywords
${JSON.stringify(zeroConversionKeywordsData, null, 2)}

## Block 4: Performance by Network
${JSON.stringify({
  network_performance: {
    headers: ["campaignName", "campaignType", "adNetworkType", "cost", "impressions", "clicks", "conversions", "roas", "cpa"],
    rows: performanceByNetworkData.campaigns?.map((campaign: { campaignName: string; campaignType: string; adNetworkType: string; cost: number; impressions: number; clicks: number; conversions: number; roas: number; cpa: number }) => [
      campaign.campaignName,
      campaign.campaignType,
      campaign.adNetworkType,
      Math.round(campaign.cost * 100) / 100,
      campaign.impressions,
      campaign.clicks,
      Math.round(campaign.conversions * 100) / 100,
      Math.round(campaign.roas * 100) / 100,
      Math.round(campaign.cpa * 100) / 100
    ]) || []
  }
}, null, 2)}

## Block 5: Search Term Analysis
${JSON.stringify(searchTermAnalysisData, null, 2)}

## Block 6: Change History Summary
${JSON.stringify({
  change_history: {
    headers: ["changeDateTime", "userEmail", "changeType", "itemChanged", "campaignChanged", "adGroupChanged", "oldValue", "newValue"],
    rows: changeHistorySummaryData.changes?.map((change: {
      changeDateTime: string;
      userEmail: string;
      changeType: string;
      itemChanged: string;
      campaignChanged?: string;
      adGroupChanged?: string;
      oldValue?: string;
      newValue?: string;
    }) => [
      change.changeDateTime,
      change.userEmail,
      change.changeType,
      change.itemChanged,
      change.campaignChanged || "",
      change.adGroupChanged || "",
      change.oldValue || "",
      change.newValue || ""
    ]) || []
  }
}, null, 2)}

## Block 7: Performance Max Deep Dive
${JSON.stringify({
  asset_group_performance: {
    headers: ["Campaign Name", "Asset Group Name", "Status", "Cost", "Conversions", "ROAS"],
    rows: performanceMaxDeepDiveData?.assetGroupPerformance?.map((item: {
      campaignName: string;
      assetGroupName: string;
      assetGroupStatus: string;
      cost: number;
      conversions: number;
      roas: number;
    }) => [
      item.campaignName,
      item.assetGroupName,
      item.assetGroupStatus,
      item.cost,
      item.conversions,
      item.roas
    ]) || []
  },
  asset_performance: {
    headers: ["Campaign Name", "Asset Group Name", "Asset Text", "Asset Type", "Performance Label"],
    rows: performanceMaxDeepDiveData?.assetPerformance?.map((item: { campaignName: string; assetGroupName: string; assetText: string; assetType: string; performanceLabel: string }) => [
      item.campaignName,
      item.assetGroupName,
      item.assetText,
      item.assetType,
      item.performanceLabel
    ]) || []
  }
}, null, 2)}

## Block 8: Landing Page Performance
${JSON.stringify({
  pages: {
    headers: ["Final URL", "Cost", "Clicks", "Conversions", "Conversion Value", "ROAS"],
    rows: landingPagePerformanceData?.pages?.map((item: { finalUrl: string; cost: number; clicks: number; conversions: number; conversionValue: number; roas: number }) => [
      item.finalUrl,
      item.cost,
      item.clicks,
      item.conversions,
      item.conversionValue,
      item.roas
    ]) || []
  }
}, null, 2)}

## Block 9: Ad Copy Text
${JSON.stringify({
  ads: {
    headers: ["Campaign Name", "Ad Group Name", "Headlines"],
    rows: adCopyTextData?.ads?.map((item: { campaignName: string; adGroupName: string; headlines?: string[] }) => [
      item.campaignName,
      item.adGroupName,
      item.headlines?.join(", ") || ""
    ]) || []
  }
}, null, 2)}

## Block 10: Geo Hot Cold
${JSON.stringify({
  locations: {
    headers: ["Location Type", "Location Name", "Country ID", "Cost", "Clicks", "Conversions", "Conversion Value", "ROAS"],
    rows: geoHotColdData?.locations?.map((item: { locationType: string; locationName: string; countryId: string; cost: number; clicks: number; conversions: number; conversionValue: number; roas: number }) => [
      item.locationType,
      item.locationName,
      item.countryId,
      item.cost,
      item.clicks,
      item.conversions,
      item.conversionValue,
      item.roas
    ]) || []
  }
}, null, 2)}`

          // Формируем финальный userPrompt с пользовательским запросом и данными Google Ads
          finalUserPrompt = `User Request: ${userPrompt}\n\n${googleAdsData}`
          console.log('Данные Google Ads успешно собраны и добавлены к запросу')
        }
      } catch (error) {
        console.warn('Ошибка при сборе данных Google Ads, используем только пользовательский запрос:', error)
      }
    }

    console.log('Отправляем запрос к Gemini API для кастомного отчета...')

    // Логирование в файл
    const logData = {
      timestamp: new Date().toISOString(),
      systemInstruction: systemInstruction.split('\n'),
      userPrompt: finalUserPrompt.split('\n'),
      userPromptLength: finalUserPrompt.length,
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(
      logDir,
      `gemini-requests-custom-report-${new Date().toISOString().split('T')[0]}.json`,
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
    
    // Проверяем на дублирование (если такой же userPrompt был в последние 10 секунд)
    const now = new Date()
    const isDuplicate = existingLogs.some((log: LogData) => {
      const logTime = new Date(log.timestamp)
      const timeDiff = now.getTime() - logTime.getTime()
      return timeDiff < 10000 && log.userPromptLength === finalUserPrompt.length
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
      contents: finalUserPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    })

    const processedPrompt = result.text

    if (!processedPrompt) {
      throw new Error('No response from Gemini API')
    }

    console.log('Успешно получен ответ от Gemini API для кастомного отчета')
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
    console.log('Ошибка в proxy-openai-custom-report:', error)
    console.error('Custom Report Proxy error:', error)

    let errorMessage = 'Internal Server Error'
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = `Gemini API error: ${error.message}`
      statusCode = 502
    }

    return new NextResponse(errorMessage, { status: statusCode })
  }
}