'use client'

import {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
  useCallback,
  useMemo,
} from 'react'
import { User } from '@supabase/supabase-js'
import { deleteCookie, getCookie, setCookie } from '@/utils/cookie'
import { updateUserUtmSource } from '@/utils/supabase/supabase-client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const UserContext = createContext<{
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
} | null>(null)

export const UserProvider = ({ children }: PropsWithChildren) => {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)
  const [isUserSigningOut, setIsUserSigningOut] = useState(false)

  const handleAuth = useCallback(async () => {
    const refresh_token = getCookie('sb-refresh-token')
    if (refresh_token) {
      try {
        deleteCookie('sb-refresh-token')
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token,
        })
        if (error) {
          console.error('Error refreshing session with stored token:', error)
          // If refresh fails, clear user state
          setUser(null)
        } else if (data.session) {
          console.log('Session refreshed successfully with stored token')
          setUser((currentUser) => {
            if (currentUser?.id === data.session!.user.id) {
              return currentUser
            }
            return data.session!.user
          })
        }
        router.refresh()
      } catch (error) {
        console.error('Error in handleAuth:', error)
        setUser(null)
      }
    } else {
      // No refresh token in cookies, try to refresh current session
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data.session) {
          console.log('Current session refreshed successfully')
          setUser((currentUser) => {
            if (currentUser?.id === data.session!.user.id) {
              return currentUser
            }
            return data.session!.user
          })
        } else {
          console.log('No valid session to refresh')
          setUser(null)
        }
      } catch (error) {
        console.error('Error refreshing current session:', error)
        setUser(null)
      }
    }
  }, [supabase.auth, router])

  // User-initiated sign out function
  const signOut = useCallback(async () => {
    try {
      setIsUserSigningOut(true)
      console.log('User initiated sign out...')

      // Clear cookies first
      deleteCookie('sb-refresh-token')

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error during sign out:', error)
      }

      // Clear user state immediately
      setUser(null)

      // Clear localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()

      console.log('Sign out completed successfully')
    } catch (error) {
      console.error('Error in signOut:', error)
      // Still clear user state even if there's an error
      setUser(null)
      localStorage.clear()
      sessionStorage.clear()
    } finally {
      setIsUserSigningOut(false)
    }
  }, [supabase.auth])

  // Initial session check and auth state changes
  useEffect(() => {
    if (hasInitialFetch) {
      return
    }

    const initializeAuth = async () => {
      try {
        // First try to get the user (secure method)
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (user && !error) {
          // User is authenticated - only update if changed
          setUser((currentUser) => {
            if (currentUser?.id === user.id) {
              return currentUser // Keep the same object reference if it's the same user
            }
            return user
          })
        } else {
          // No user or error - check if we have session for handling auth
          const { data: sessionData } = await supabase.auth.getSession()
          if (!sessionData.session) {
            await handleAuth()
          }
          setUser(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
        setHasInitialFetch(true)
      }
    }

    void initializeAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        'Auth state change:',
        event,
        session ? 'session exists' : 'no session',
      )

      if (event === 'SIGNED_OUT') {
        /*
         * User signed out - don't try to restore session if it was
         * user-initiated
         */
        if (isUserSigningOut) {
          console.log('User-initiated sign out detected, not restoring session')
          setUser(null)
          return
        }

        /*
         * If not user-initiated, it might be a token expiration - try to
         * restore
         */
        console.log(
          'Non-user-initiated sign out, attempting to restore session...',
        )
        await handleAuth()
        setUser(null)
      } else if (session) {
        /*
         * For auth state changes, we can trust the session user
         * (this is triggered by Supabase itself, not external storage)
         * Only update if the user has actually changed
         */
        setUser((currentUser) => {
          if (currentUser?.id === session.user.id) {
            return currentUser // Keep the same object reference if it's the same user
          }
          return session.user
        })
      } else {
        // No session and not a sign out event
        setUser(null)
      }

      // Store refresh token in cookies when session changes
      if (session?.refresh_token) {
        setCookie('sb-refresh-token', session.refresh_token, 7) // Store for 7 days
      }
    })

    // Save refresh token before page unload
    const handleBeforeUnload = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.refresh_token) {
          setCookie('sb-refresh-token', session.refresh_token, 7)
        }
      } catch (error) {
        console.error('Error saving refresh token:', error)
      }
    }

    window.addEventListener('beforeunload', () => void handleBeforeUnload())

    return () => {
      subscription.unsubscribe()
      window.removeEventListener(
        'beforeunload',
        () => void handleBeforeUnload(),
      )
    }
  }, [supabase.auth, handleAuth, hasInitialFetch, isUserSigningOut])

  // UTM source handling
  useEffect(() => {
    if (!user) {
      return
    }

    const setUtmSource = async () => {
      const utm_source = getCookie('utm_source')
      if (!utm_source || utm_source === 'used') {
        return
      }

      const newUtm = await updateUserUtmSource(supabase, user.id, utm_source)
      if (newUtm) {
        setCookie('utm_source', 'used', 720)
      }
    }

    void setUtmSource()
  }, [supabase, user])

  // Periodic session refresh to keep user logged in
  useEffect(() => {
    const checkAndRefreshSession = async () => {
      try {
        // First check if user is authenticated (secure method)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError ?? !user) {
          console.log('User not authenticated, handling auth flow')
          await handleAuth()
          return
        }

        // Get session to check expiry (for refresh token management only)
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          const expiresAt = new Date(sessionData.session.expires_at!).getTime()
          const now = Date.now()
          const sixHours = 6 * 60 * 60 * 1000 // Refresh 6 hours before expiry

          if (expiresAt - now < sixHours) {
            console.log('Session expiring soon, refreshing...')
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Error refreshing session:', refreshError)
              // If refresh fails, verify user again
              const {
                data: { user: verifiedUser },
              } = await supabase.auth.getUser()
              setUser(verifiedUser)
            } else if (refreshData.session) {
              console.log('Session refreshed successfully')
              // Get verified user after refresh
              const {
                data: { user: refreshedUser },
              } = await supabase.auth.getUser()
              setUser(refreshedUser)
            }
          }
        }
      } catch (error) {
        console.error('Error in periodic refresh:', error)
      }
    }

    // Initial check
    void checkAndRefreshSession()

    // Set up periodic checks every 15 minutes
    const refreshInterval = setInterval(
      () => {
        void checkAndRefreshSession()
      },
      15 * 60 * 1000,
    )

    return () => clearInterval(refreshInterval)
  }, [supabase.auth, handleAuth])

  return (
    <UserContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
