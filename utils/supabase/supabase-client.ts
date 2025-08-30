import { Database } from '@/types_db'
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { ConsentStatus, SupabaseUser } from '../types'

// Initialize supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function updateUserName(
  supabase: SupabaseClient,
  userId: string,
  userName: string,
) {
  const { data, error } = await supabase
    .from('users')
    .update({ full_name: userName })
    .eq('id', userId)
    .select()

  if (error) {
    throw error
  }
  return data[0] as string
}

export async function updateUserUtmSource(
  supabase: SupabaseClient,
  userId: string,
  utm_source: string,
) {
  const { data, error } = await supabase
    .from('users')
    .update({ utm_source: utm_source })
    .eq('id', userId)
    .select()

  if (error) {
    console.error(error)
    return null
  }

  return data[0] as string
}

// Retrieves the current authenticated user from Supabase.
export async function getUser(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

// Performs a request to fetch a file by its URL.
export async function fetchFile(url: string) {
  try {
    const response = await fetch(`${url}?t=${String(Date.now())}`)

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    const text = await response.text()
    return text
  } catch (error) {
    console.error('Error while fetching file:', error)
    return null
  }
}

export async function updateUserConsentStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: ConsentStatus,
) {
  const { data, error } = await supabase
    .from('users')
    .update({
      consent_status: status,
    })
    .eq('id', userId)
    .select()

  if (error) {
    console.error(error)
    return null
  }

  return data[0]
}

export async function getUserDetails(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  try {
    const { data: userDetails, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
    if (error) {
      console.error('Error:', error)
      return null
    }
    return userDetails[0]
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function getCallback(
  supabase: SupabaseClient<Database>,
  gpt_id: string,
) {
  try {
    const { data, error } = await supabase
      .from('v_gpt_callback')
      .select('*')
      .eq('gpt_id', gpt_id)
    if (error) {
      console.error('Error:', error)
      return null
    }
    return data[0]
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function getUserInfo(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('users')
    .select<string, SupabaseUser>('*')
    .eq('id', userId)

  if (error) {
    console.error(error)
    return null
  }

  return data[0]
}

export async function getUserActiveSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      `
      *,
      prices (
        *,
        products(*)
      )
    `,
    )
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}

export async function getUserTokens(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user tokens:', error)
    return null
  }

  return {
    tokensRemaining: data.tokens_remaining,
    tokensUsed: data.tokens_used,
    subscriptionId: data.subscription_id,
  }
}

export async function updateUserTokens(
  supabase: SupabaseClient<Database>,
  userId: string,
  tokensToSpend: number,
) {
  // First get current token values
  const { data: currentTokens, error: fetchError } = await supabase
    .from('user_tokens')
    .select('tokens_remaining, tokens_used')
    .eq('user_id', userId)
    .single()

  if (fetchError ?? !currentTokens) {
    console.error('Error fetching current tokens:', fetchError)
    return null
  }

  // Calculate new values
  const newTokensRemaining = Math.max(
    0,
    currentTokens.tokens_remaining - tokensToSpend,
  )
  const newTokensUsed = currentTokens.tokens_used + tokensToSpend

  // Update with new values
  const { data, error } = await supabase
    .from('user_tokens')
    .update({
      tokens_remaining: newTokensRemaining,
      tokens_used: newTokensUsed,
    })
    .eq('user_id', userId)
    .select('tokens_remaining, tokens_used')
    .single()

  if (error) {
    console.error('Error updating tokens:', error)
    return null
  }

  return data
}

// Add interface for Song type
export interface Song {
  id: string
  user_id: string
  title: string
  url: string
  created_at: string
  duration?: number
  genre?: string
  mood?: string
}

// Add getUserSongs function
export async function getUserSongs(userId: string): Promise<Song[] | null> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user songs:', error)
    return null
  }

  return data as Song[]
}

// Проверить и создать токены для пользователя-чатбота, если они не существуют
export async function ensureGptUserTokens(
  supabase: SupabaseClient<Database>,
  userId: string,
  initialTokens = 20, // По умолчанию начисляем 20 токенов для новых пользователей
): Promise<{ tokensRemaining: number; tokensUsed: number } | null> {
  try {
    // Проверяем, существует ли уже запись для этого пользователя
    const { data: existingTokens, error: checkError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // Код ошибки "не найдено"
        console.log(
          `No tokens record found for user ${userId}, creating new record with ${initialTokens} tokens`,
        )

        // Создаем новую запись с начальным балансом
        const { data: newTokens, error: insertError } = await supabase
          .from('user_tokens')
          .insert({
            user_id: userId,
            tokens_remaining: initialTokens,
            tokens_used: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating initial tokens:', insertError)
          return null
        }

        return {
          tokensRemaining: newTokens.tokens_remaining,
          tokensUsed: newTokens.tokens_used,
        }
      }

      console.error('Error checking user tokens:', checkError)
      return null
    }

    // Запись существует, возвращаем текущие данные
    return {
      tokensRemaining: existingTokens.tokens_remaining,
      tokensUsed: existingTokens.tokens_used,
    }
  } catch (error) {
    console.error('Error in ensureGptUserTokens:', error)
    return null
  }
}
