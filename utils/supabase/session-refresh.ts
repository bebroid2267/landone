import { createClient } from '@/utils/supabase/client'

/**
 * Utility function to refresh Supabase session if it's expired or about to
 * expire
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const supabase = createClient()

    // First check if user is authenticated (secure method)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError ?? !user) {
      console.log('User not authenticated')
      return false
    }

    // Get session for expiry check (for refresh token management only)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error getting session for expiry check:', sessionError)
      return false
    }

    if (!sessionData.session) {
      console.log('No active session found')
      return false
    }

    // Check if session is about to expire (within 6 hours)
    const expiresAt = new Date(sessionData.session.expires_at!).getTime()
    const now = Date.now()
    const sixHours = 6 * 60 * 60 * 1000

    if (expiresAt - now < sixHours) {
      console.log('Session expiring soon, refreshing...')
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('Error refreshing session:', refreshError)
        return false
      } else if (refreshData.session) {
        console.log('Session refreshed successfully')
        // Verify user is still authenticated after refresh
        const {
          data: { user: verifiedUser },
        } = await supabase.auth.getUser()
        return !!verifiedUser
      }
    }

    return true
  } catch (error) {
    console.error('Error in refreshSessionIfNeeded:', error)
    return false
  }
}

/**
 * Utility function to check if user is authenticated and refresh session if
 * needed
 */
export async function ensureAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Try to refresh session if it's expired
      if (
        error.message.includes('expired') ||
        error.message.includes('invalid')
      ) {
        const refreshed = await refreshSessionIfNeeded()
        if (refreshed) {
          // Get user again after refresh
          const {
            data: { user: refreshedUser },
          } = await supabase.auth.getUser()
          return !!refreshedUser
        }
      }
      return false
    }

    return !!user
  } catch (error) {
    console.error('Error in ensureAuthenticated:', error)
    return false
  }
}
