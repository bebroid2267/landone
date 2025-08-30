import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types_db'

type Tokens = Database['public']['Tables']['user_tokens']['Row']

export function useTokens(userId: string | undefined) {
  const [tokens, setTokens] = useState<Tokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchTokens = async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        throw error
      }

      setTokens(data)
    } catch (e) {
      console.error('Error fetching tokens:', e)
      setError(e instanceof Error ? e.message : 'Failed to fetch tokens')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchTokens()
  }, [userId])

  return {
    tokens,
    isLoading,
    error,
    mutate: fetchTokens,
  }
}
