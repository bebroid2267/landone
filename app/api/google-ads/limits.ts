/*
 * Configuration file for Google Ads API query limits
 * These limits help reduce the amount of data sent to Gemini API
 */

export const GOOGLE_ADS_LIMITS = {
  // Main data endpoints - these are the biggest data sources
  SEARCH_TERM_ANALYSIS: 1000, // Reduced from 2000
  SEARCH_TERM_COVERAGE: 20,
  DAILY_TRENDS: 1000,
  DAILY_TRENDS_CAMPAIGNS: 10,
  AD_GROUP_THEMING: 500, // Reduced from 1000
  ZERO_CONVERSION_KEYWORDS: 30, // Reduced from 50
  ZERO_CONVERSION_ADGROUPS: 20,
  CHANGE_HISTORY_SUMMARY: 100, // Reduced from 200
  CAMPAIGN_STRUCTURE_OVERVIEW: 50, // Reduced from 100
  CAMPAIGNS: 20,
  ACCOUNT_DETAILS_CUSTOMER: 1,
  ACCOUNT_DETAILS_CAMPAIGNS: 20,

  // Performance data endpoints
  PERFORMANCE_BY_NETWORK: 100,
  LANDING_PAGE_PERFORMANCE: 100,
  PERFORMANCE_MAX_DEEP_DIVE: 50,

  // Text and content endpoints
  AD_COPY_TEXT: 200,
  AD_ASSET_PERFORMANCE: 20,
  ADS_ASSETS: 20,
  NEGATIVE_KEYWORDS_GAPS: 20,

  // Geographic and other analysis
  GEO_HOT_COLD_PERFORMANCE: 100,
  ROAS_BY_DEVICE_GEOGRAPHY: 20,

  // Conversion and setup data
  CONVERSION_ACTION_SETUP: 20,
  CONVERSION_ACTION_INVENTORY: 20,
  CONVERSION_TIMING: 20,
  ASSISTED_CONVERSIONS: 20,
  KEYWORD_MATCH_TYPE_MIX: 200,
  NEW_KEYWORDS: 50, // Recently active keywords analysis
  CAMPAIGN_PACING: 50, // Campaign budget pacing analysis
  WEEKLY_SEARCH_TERMS: 250, // Weekly search terms analysis
  AUDIENCE_DATA: 100, // Audience and demographic data analysis

  // Weekly report specific limits (even more conservative)
  WEEKLY_LIMITS: {
    SEARCH_TERM_ANALYSIS: 500,
    SEARCH_TERM_COVERAGE: 15,
    DAILY_TRENDS: 500,
    DAILY_TRENDS_CAMPAIGNS: 5,
    AD_GROUP_THEMING: 250,
    ZERO_CONVERSION_KEYWORDS: 20,
    ZERO_CONVERSION_ADGROUPS: 15,
    CHANGE_HISTORY_SUMMARY: 50,
    CAMPAIGN_STRUCTURE_OVERVIEW: 30,
    CAMPAIGNS: 15,
    ACCOUNT_DETAILS_CUSTOMER: 1,
    ACCOUNT_DETAILS_CAMPAIGNS: 15,
    PERFORMANCE_BY_NETWORK: 50,
    LANDING_PAGE_PERFORMANCE: 50,
    PERFORMANCE_MAX_DEEP_DIVE: 30,
    AD_COPY_TEXT: 100,
    AD_ASSET_PERFORMANCE: 15,
    ADS_ASSETS: 15,
    NEGATIVE_KEYWORDS_GAPS: 15,
    GEO_HOT_COLD_PERFORMANCE: 50,
    ROAS_BY_DEVICE_GEOGRAPHY: 15,
    CONVERSION_ACTION_SETUP: 15,
    CONVERSION_ACTION_INVENTORY: 15,
    CONVERSION_TIMING: 15,
    ASSISTED_CONVERSIONS: 15,
    KEYWORD_MATCH_TYPE_MIX: 100,
    NEW_KEYWORDS: 30, // Recently active keywords for weekly reports
    CAMPAIGN_PACING: 30, // Campaign budget pacing for weekly reports
    WEEKLY_SEARCH_TERMS: 150, // Weekly search terms for weekly reports
    AUDIENCE_DATA: 50, // Audience and demographic data for weekly reports
  },
} as const

// Helper function to get limit based on context
export function getLimit(
  endpoint: keyof typeof GOOGLE_ADS_LIMITS,
  isWeeklyReport = false,
): number {
  if (isWeeklyReport && endpoint in GOOGLE_ADS_LIMITS.WEEKLY_LIMITS) {
    return GOOGLE_ADS_LIMITS.WEEKLY_LIMITS[
      endpoint as keyof typeof GOOGLE_ADS_LIMITS.WEEKLY_LIMITS
    ]
  }

  const limit = GOOGLE_ADS_LIMITS[endpoint]
  return typeof limit === 'number' ? limit : 100 // Default fallback
}
