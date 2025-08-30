import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

interface SearchTerm {
  term: string
  impressions: number
  clicks: number
  assistedConversions: number
  assistedConversionValue: number
  lastClickConversions: number
  lastClickConversionValue: number
  averagePosition: number
  ctr: number
  cvr: number
  isTechnical: boolean
  relatedBrandTerms: string[]
}

export interface AssistedConversionsData {
  searchTerms: SearchTerm[]
  summary: {
    totalAssistedConversions: number
    totalLastClickConversions: number
    averageAssistedConversionValue: number
    averageLastClickConversionValue: number
  }
}

interface GoogleAdsResponse {
  results: {
    searchTermView?: {
      searchTerm: string
    }
    metrics?: {
      impressions: string
      clicks: string
      conversions: string
      conversionsValue: string
      ctr: string
      conversionsFromInteractionsRate: string
      averagePosition: string
    }
  }[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getAssistedConversionsData)
}

async function getAssistedConversionsData(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<AssistedConversionsData> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  const gaql = `
  SELECT
    search_term_view.search_term,
    campaign.status,
    ad_group.status,
    metrics.impressions,
    metrics.clicks,
    metrics.conversions,
    metrics.conversions_value,
    metrics.ctr,
    metrics.conversions_from_interactions_rate
  FROM search_term_view
  WHERE
    ${dateFilter ? `${dateFilter} AND` : ''}
    metrics.impressions > 0
    AND metrics.clicks > 0
    AND campaign.status IN ('ENABLED', 'PAUSED')
    AND ad_group.status IN ('ENABLED', 'PAUSED')
    ${campaignFilter}
  ORDER BY metrics.cost_micros DESC
  LIMIT ${getLimit('ASSISTED_CONVERSIONS')}
`
  const response = await googleAdsApiRequest(
    accessToken,
    accountId,
    gaql,
    userId,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Ads API request failed: ${errorText}`)
  }

  const data = (await response.json()) as GoogleAdsResponse
  const searchTerms: SearchTerm[] = (data.results ?? []).map((row) => {
    const searchTerm = row.searchTermView?.searchTerm ?? ''
    const metrics = row.metrics ?? {
      impressions: '0',
      clicks: '0',
      conversions: '0',
      conversionsValue: '0',
      ctr: '0',
      conversionsFromInteractionsRate: '0',
      averagePosition: '0',
    }

    // Determine if it's a technical term (this is a simplified example)
    const isTechnical =
      searchTerm.toLowerCase().includes('how') ??
      searchTerm.toLowerCase().includes('what') ??
      searchTerm.toLowerCase().includes('where')

    return {
      term: searchTerm,
      impressions: Number(metrics.impressions) || 0,
      clicks: Number(metrics.clicks) || 0,
      assistedConversions: Number(metrics.conversions) || 0,
      assistedConversionValue: Number(metrics.conversionsValue) || 0,
      lastClickConversions: Number(metrics.conversions) || 0,
      lastClickConversionValue: Number(metrics.conversionsValue) || 0,
      averagePosition: Number(metrics.averagePosition) || 0,
      ctr: Number(metrics.ctr) || 0,
      cvr: Number(metrics.conversionsFromInteractionsRate) || 0,
      isTechnical,
      relatedBrandTerms: [], // This would need additional logic to populate
    }
  })

  const summary = {
    totalAssistedConversions: searchTerms.reduce(
      (sum: number, term: SearchTerm) => sum + term.assistedConversions,
      0,
    ),
    totalLastClickConversions: searchTerms.reduce(
      (sum: number, term: SearchTerm) => sum + term.lastClickConversions,
      0,
    ),
    averageAssistedConversionValue:
      searchTerms.reduce(
        (sum: number, term: SearchTerm) => sum + term.assistedConversionValue,
        0,
      ) /
      (searchTerms.filter((term: SearchTerm) => term.assistedConversions > 0)
        .length || 1),
    averageLastClickConversionValue:
      searchTerms.reduce(
        (sum: number, term: SearchTerm) => sum + term.lastClickConversionValue,
        0,
      ) /
      (searchTerms.filter((term: SearchTerm) => term.lastClickConversions > 0)
        .length || 1),
  }

  return {
    searchTerms,
    summary,
  }
}
