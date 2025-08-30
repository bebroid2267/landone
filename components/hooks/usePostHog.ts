'use client'

import { useCallback } from 'react'
import { posthog } from '@/utils/posthog/client'

export const usePostHog = () => {
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      posthog.capture(eventName, properties)
    },
    [],
  )

  const identify = useCallback(
    (userId: string, properties?: Record<string, any>) => {
      posthog.identify(userId, properties)
    },
    [],
  )

  const reset = useCallback(() => {
    posthog.reset()
  }, [])

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    posthog.people.set(properties)
  }, [])

  return {
    trackEvent,
    identify,
    reset,
    setUserProperties,
  }
}
