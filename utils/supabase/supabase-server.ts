import { Database } from '@/types_db'
import { SupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'

export const getUser = cache(async (supabase: SupabaseClient<Database>) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
})

export const getSubscription = cache(
  async (supabase: SupabaseClient<Database>, userId: string) => {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, prices(*, products(*))')
        .eq('user_id', userId)
        .in('status', ['trialing', 'active'])
        .throwOnError()

      return subscription
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  },
)

export const getUserDetails = cache(
  async (supabase: SupabaseClient<Database>, userId: string) => {
    try {
      const { data: userDetails } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
      return userDetails![0]
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  },
)

export const getActiveProductsWithPrices = async (
  supabase: SupabaseClient<Database>,
) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' })

  if (error) {
    console.log(error.message)
    return []
  }

  return products ? products : []
}

export async function getSubscriptionByUserId(
  supabase: SupabaseClient<Database>,
  id: string | null,
) {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        prices!subscriptions_price_id_fkey (
          *,
          products!prices_product_id_fkey (*)
        )
      `,
      )
      .eq('user_id', id!)
      .in('status', ['trialing', 'active'])
      .maybeSingle()
      .throwOnError()
    return subscription
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
