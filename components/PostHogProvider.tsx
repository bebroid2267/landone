'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { posthog } from '@/utils/posthog/client'
import { useUser } from '@/components/hooks/useUser'

function PostHogTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useUser()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + searchParams.toString()
      }

      // Send pageview event
      posthog.capture('$pageview', {
        $current_url: url,
        $pathname: pathname,
        $search_params: searchParams?.toString() || '',
      })
    }
  }, [pathname, searchParams])

  // Identify user when they log in
  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id, {
        email: user.email,
        name: (user.user_metadata as { full_name?: string })?.full_name,
        created_at: user.created_at,
      })
    } else {
      // Reset identity for anonymous users
      posthog.reset()
    }
  }, [user])

  return null
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <PostHogTracker />
      {children}
    </Suspense>
  )
}
