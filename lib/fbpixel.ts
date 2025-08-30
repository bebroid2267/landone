declare global {
  interface Window {
    fbq: (...args: any[]) => void
  }
}

export const fbq = (...args: Parameters<Window['fbq']>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args)
  }
}

// Custom event types for our app
export const MetaPixelEvents = {
  // Main functionality tracking
  FULL_AUDIT_GENERATED: 'FullAuditGenerated',
  WEEKLY_AUDIT_GENERATED: 'WeeklyAuditGenerated',
  SCHEDULE: 'Schedule',

  // Page navigation tracking
  DASHBOARD_VIEW: 'ViewDashboard',
  DATA_EXPLORER_VIEW: 'ViewDataExplorer',
  TOOLKITS_VIEW: 'ViewToolkits',
  SETTINGS_VIEW: 'ViewSettings',

  // Toolkit pages tracking
  AD_COPY_LAB_VIEW: 'ViewAdCopyLab',
  ASSET_PERFORMANCE_MATRIX_VIEW: 'ViewAssetPerformanceMatrix',
  AUDIENCE_ANALYZER_VIEW: 'ViewAudienceAnalyzer',
  BUDGET_SIMULATOR_VIEW: 'ViewBudgetSimulator',
  CUSTOM_REPORTING_BUILDER_VIEW: 'ViewCustomReportingBuilder',
  KEYWORD_MINER_VIEW: 'ViewKeywordMiner',
  ROI_ARENA_VIEW: 'ViewROIArena',

  // User actions
  ACCOUNT_CONNECTED: 'ConnectGoogleAds',
  REPORT_DOWNLOADED: 'DownloadReport',
  COMPLEXITY_CONSULTATION: 'RequestConsultation',
  PRO_UPGRADE_CLICK: 'ClickProUpgrade',
} as const

// Helper functions for specific tracking
export const trackFullAudit = (accountId?: string, timeRange?: string) => {
  fbq('track', MetaPixelEvents.FULL_AUDIT_GENERATED, {
    account_id: accountId,
    time_range: timeRange,
    content_name: 'Full Google Ads Audit',
  })
}

export const trackWeeklyAudit = (accountId?: string) => {
  fbq('track', MetaPixelEvents.WEEKLY_AUDIT_GENERATED, {
    account_id: accountId,
    time_range: 'LAST_7_DAYS',
    content_name: 'Weekly Google Ads Analysis',
  })
}

export const trackPageView = (
  pageName: string,
  additionalData?: Record<string, any>,
) => {
  fbq('track', 'PageView', {
    content_name: pageName,
    ...additionalData,
  })
}

export const trackCustomEvent = (
  eventName: string,
  data?: Record<string, any>,
) => {
  fbq('track', eventName, data)
}
