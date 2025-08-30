// These interfaces match what we'll return for each data type
export interface ConversionTimingData {
  dayOfWeek: {
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
    friday: number
    saturday: number
    sunday: number
  }
  hourOfDay: Record<string, number> // Keys are hours "0" to "23"
  campaignShare: Record<
    string,
    { name: string; conversions: number; share: number }
  >
}

export interface ZeroConversionKeywords {
  zero_conversion_keywords: {
    comment: string
    headers: string[]
    rows: (string | number)[][]
  }
}

export interface AdGroupDistribution {
  tiers: {
    lowSpend: { count: number; spend: number }
    mediumSpend: { count: number; spend: number }
    highSpend: { count: number; spend: number }
  }
  lowSpendAdGroups: {
    name: string
    campaign: string
    spend: number
    clicks: number
  }[]
}

export interface NetworkPerformance {
  network_performance: {
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalCost: number
    averageRoas: number
  }
  outlierCampaigns: {
    name: string
    networkType: string
    deviation: number
  }[]
}

export interface SearchTermCoverage {
  coverage: {
    exact: { impressions: number; cost: number; share: number }
    phrase: { impressions: number; cost: number; share: number }
    broad: { impressions: number; cost: number; share: number }
  }
  topTerms: {
    term: string
    cost: number
    impressions: number
    clicks: number
  }[]
}

export interface RoasByDeviceGeography {
  data: {
    device: string
    countries: Record<
      string,
      {
        roas: number
        cpa: number
        cost: number
        conversions: number
        roasVariance: number
        cpaVariance: number
      }
    >
  }[]
  accountMetrics: {
    medianRoas: number
    medianCpa: number
  }
}

export interface ConversionActionInventory {
  actions: {
    name: string
    status: string
    type: string
    volume: number
  }[]
}

export interface NegativeKeywordsGaps {
  newIrrelevantTerms: {
    count: number
    sinceDate: string
    percentage: number
  }
  highSpendPlacements: {
    placement: string
    cost: number
    ctr: number
  }[]
}

export interface ImpressionShareLost {
  impression_share_lost: {
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    avgLostBudget: number
    avgLostRank: number
    highRiskCampaigns: number
  }
}

export interface AdAssetPerformance {
  asset_performance: {
    headers: string[]
    rows: (string | number | boolean)[][]
  }
  summary: {
    totalAssets: number
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    averageCtr: number
    averageConversionRate: number
  }
  topConvertingAssets: {
    assetText: string
    assetType: string
    conversions: number
    topKeywords: { keyword: string; conversions: number }[]
  }[]
}

// Interface for RSA asset performance data
export interface RsaAssetPerformance {
  pinnedAssets: {
    adGroupId: string
    adId: string
    assetId: string
    assetType: string
    assetText: string
    pinnedField: string
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    conversionsValue: number
    costMicros: number
    date: string
  }[]
  keywordConversions: {
    keywordText: string
    adGroupId: string
    adId: string
    adType: string
    conversionActionName: string
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    conversionsValue: number
  }[]
}

export interface Campaign {
  id: string
  name: string
  status: string
  channelType: string
  metrics: {
    clicks: number
    impressions: number
    ctr: number
    costMicros: number
    averageCpc: number
  }
}

export interface ConversionActionSetup {
  conversionActions: {
    conversionActionName: string
    status: string
    category: string
    isPrimary: boolean
    hasValueMetric: boolean
    valueModelType: string
    last90DayVolume: number
    roas: number
  }[]
}

export interface CampaignStructureOverview {
  campaign_overview: {
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalCampaigns: number
    totalCost: number
    avgRoas: number
    topPerformers: number
    underPerformers: number
  }
}

export interface KeywordMatchTypeMix {
  match_type_overview: {
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalKeywords: number
    totalCost: number
    totalConversions: number
    totalConversionValue: number
    averageRoas: number
  }
}

export interface AdGroupTheming {
  campaigns: {
    campaignName: string
    ad_group_summary: {
      adGroupName: string
      keywordCount: number
      cost: number
      roas: number
      top_spending_keywords_sample: string[]
    }[]
  }[]
}

export interface PerformanceByNetwork {
  campaigns: {
    campaignName: string
    campaignType: string
    adNetworkType: string
    cost: number
    impressions: number
    clicks: number
    conversions: number
    roas: number
    cpa: number
  }[]
}

export interface SearchTermAnalysis {
  search_term_analysis: {
    harvest_opportunities: {
      comment: string
      headers: string[]
      rows: (string | number)[][]
    }
    negative_candidates: {
      comment: string
      headers: string[]
      rows: (string | number)[][]
    }
    performance_gaps: {
      comment: string
      headers: string[]
      rows: (string | number)[][]
    }
  }
}

export interface ChangeHistorySummary {
  change_history: {
    comment: string
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalChanges: number
    dateRange: string
    mostActiveUser: string
    mostChangedCampaign: string
  }
}

export interface NewKeywords {
  new_keywords: {
    comment: string
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalNewKeywords: number
    dateRange: string
    averageRoas: number
    totalCost: number
  }
}

// New interface for Performance Max Deep Dive (Block 7)
export interface PerformanceMaxDeepDive {
  assetGroupPerformance: {
    campaignName: string
    assetGroupName: string
    assetGroupStatus: string
    cost: number
    conversions: number
    roas: number
  }[]
  assetPerformance: {
    campaignName: string
    assetGroupName: string
    assetText: string
    assetType: string
    performanceLabel: string
  }[]
}

// Interface for Landing Page Performance Analysis (Block 8)
export interface LandingPagePerformance {
  pages: {
    finalUrl: string
    cost: number
    clicks: number
    conversions: number
    conversionValue: number
    roas: number
  }[]
}

export interface CampaignPacing {
  campaign_pacing: {
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalCampaigns: number
    totalBudget: number
    totalSpend: number
    budgetUtilization: number
    overBudgetCampaigns: number
    underBudgetCampaigns: number
  }
}

// Interface for Ad Copy Text (Block 9)
export interface AdCopyText {
  ads: {
    campaignName: string
    adGroupName: string
    headlines: string[]
    descriptions: string[]
  }[]
}

// Interface for Geographic Hot & Cold Zone Analysis (Block 10)
export interface GeoHotColdPerformance {
  locations: {
    locationType: string // CITY, POSTAL_CODE, METRO_AREA
    locationName: string
    countryId: string
    cost: number
    clicks: number
    conversions: number
    conversionValue: number
    roas: number
  }[]
}
