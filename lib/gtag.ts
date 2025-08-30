declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// Google Analytics event types for our app
export const GAEvents = {
  // Main functionality tracking
  FULL_AUDIT_GENERATED: 'full_audit_generated',
  WEEKLY_AUDIT_GENERATED: 'weekly_audit_generated',
  SCHEDULE: 'schedule',

  // Page navigation tracking
  DASHBOARD_VIEW: 'view_dashboard',
  DATA_EXPLORER_VIEW: 'view_data_explorer',
  TOOLKITS_VIEW: 'view_toolkits',
  SETTINGS_VIEW: 'view_settings',

  // Toolkit pages tracking
  AD_COPY_LAB_VIEW: 'view_ad_copy_lab',
  ASSET_PERFORMANCE_MATRIX_VIEW: 'view_asset_performance_matrix',
  AUDIENCE_ANALYZER_VIEW: 'view_audience_analyzer',
  BUDGET_SIMULATOR_VIEW: 'view_budget_simulator',
  CUSTOM_REPORTING_BUILDER_VIEW: 'view_custom_reporting_builder',
  KEYWORD_MINER_VIEW: 'view_keyword_miner',
  ROI_ARENA_VIEW: 'view_roi_arena',

  // User actions
  ACCOUNT_CONNECTED: 'connect_google_ads',
  REPORT_DOWNLOADED: 'download_report',
  COMPLEXITY_CONSULTATION: 'request_consultation',
  PRO_UPGRADE_CLICK: 'click_pro_upgrade',
} as const

// Helper functions for specific tracking
export const trackFullAuditGA = (accountId?: string, timeRange?: string) => {
  gtag('event', GAEvents.FULL_AUDIT_GENERATED, {
    event_category: 'audit',
    event_label: 'full_audit',
    account_id: accountId,
    time_range: timeRange,
    value: 1,
  })
}

export const trackWeeklyAuditGA = (accountId?: string) => {
  gtag('event', GAEvents.WEEKLY_AUDIT_GENERATED, {
    event_category: 'audit',
    event_label: 'weekly_audit',
    account_id: accountId,
    time_range: 'LAST_7_DAYS',
    value: 1,
  })
}

export const trackPageViewGA = (
  pageName: string,
  additionalData?: Record<string, any>,
) => {
  gtag('event', 'page_view', {
    event_category: 'navigation',
    event_label: pageName,
    page_title: pageName,
    ...additionalData,
  })
}

export const trackCustomEventGA = (
  eventName: string,
  data?: Record<string, any>,
) => {
  gtag('event', eventName, {
    event_category: 'engagement',
    ...data,
  })
}
