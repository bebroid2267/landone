import { PostHog } from 'posthog-node'

const serverSidePosthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
})

type Event =
  | 'roasdog_report_generation_success_7_days'
  | 'roasdog_report_generation_success_30_days'
  | 'roasdog_report_generation_error_7_days'
  | 'roasdog_report_generation_error_30_days'
  | 'roasdog_page_visit_faq'
  | 'roasdog_page_visit_contact'
  | 'roasdog_page_visit_pricing'
  | 'roasdog_page_visit_benefits'
  | 'roasdog_page_visit_common-mistakes'
  | 'roasdog_page_visit_optimization-guide'
  | 'roasdog_page_visit_cases'

interface UserData {
  userId: string
}

interface ReportGenerationMetadata {
  accountId?: string
  campaignId?: string
  timeRange: '7_days' | '30_days'
  error?: string
  duration?: number
  reportType?: 'regular' | 'weekly'
}

interface PageVisitMetadata {
  page:
    | 'faq'
    | 'contact'
    | 'pricing'
    | 'benefits'
    | 'common-mistakes'
    | 'optimization-guide'
    | 'cases'
  referrer?: string
  timestamp?: string
}

// Utility function to get session ID (can be used on client side)
export const getSessionId = (user?: { id: string } | null) => {
  if (typeof window === 'undefined') {
    return 'server_side_session'
  }

  if (user?.id) {
    return user.id
  }

  let tempId = localStorage.getItem('google_ads_temp_id')
  if (!tempId) {
    tempId = `temp_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem('google_ads_temp_id', tempId)
  }
  return tempId
}

export const sendEvent = (
  event: Event,
  userData: UserData,
  metadata?: ReportGenerationMetadata | PageVisitMetadata,
): void => {
  const properties: Record<string, any> = {
    ...metadata,
    userId: userData.userId,
  }

  serverSidePosthog.capture({
    distinctId: userData.userId,
    event: event,
    properties: properties,
  })
}

// Helper functions for easier event tracking
export const trackReportGeneration = (
  success: boolean,
  timeRange: '7_days' | '30_days',
  userData: UserData,
  metadata?: Omit<ReportGenerationMetadata, 'timeRange'>,
) => {
  const eventType = success ? 'success' : 'error'
  const event = `roasdog_report_generation_${eventType}_${timeRange}` as Event

  sendEvent(event, userData, {
    ...metadata,
    timeRange,
  })
}

export const trackPageVisit = (
  page:
    | 'faq'
    | 'contact'
    | 'pricing'
    | 'benefits'
    | 'common-mistakes'
    | 'optimization-guide'
    | 'cases',
  userData: UserData,
  metadata?: Omit<PageVisitMetadata, 'page'>,
) => {
  const event = `roasdog_page_visit_${page}` as Event

  sendEvent(event, userData, {
    ...metadata,
    page,
    timestamp: new Date().toISOString(),
  })
}
