import { createHash } from 'crypto'
import { supabaseAdmin } from './supabase-admin'
// Cast to any to bypass TypeScript table typings for dynamic tables / RPC
const db: any = supabaseAdmin

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

export interface ReportsCacheEntry {
  id: string
  user_id: string
  account_id: string
  time_range: string
  campaign_id: string | null
  report_content: string
  /** Raw chart series or arrays used for rendering dashboard charts */
  performance_charts?: unknown
  /** Pre-aggregated count of enabled campaigns */
  active_campaigns?: number
  /** Pre-aggregated average ROAS (e.g. 4.5) */
  average_roas?: number
  /** Recent change-log or activities */
  recent_activity?: unknown
  cache_key: string
  created_at: string
  updated_at: string
  expires_at: string
}

export interface CreateCacheEntryParams {
  userId: string
  accountId: string
  timeRange: string
  campaignId?: string | null
  reportContent: string
  reportType?: 'weekly' | 'regular' // Add report type to prevent cache collision
  // Dashboard-specific optional payloads
  performanceCharts?: unknown
  activeCampaigns?: number
  averageRoas?: number
  recentActivity?: unknown
}

/*
 * Временное in-memory cache остаётся как fallback на случай, если таблицы
 * ещё не созданы или Supabase недоступен. Ключи и формат те же.
 */
const memoryCache = new Map<
  string,
  {
    report_content: string
    expires_at: Date
    user_id: string
  }
>()

/**
 * Генерирует ключ кэша для отчета
 */
export function generateCacheKey(
  userId: string,
  accountId: string,
  timeRange: string,
  campaignId?: string | null,
  reportType: 'weekly' | 'regular' = 'regular', // Add report type parameter
  dataOnly = false, // Add dataOnly parameter to differentiate cache keys
): string {
  const key = `${userId}:${accountId}:${timeRange}:${
    campaignId ?? 'null'
  }:${reportType}:${dataOnly ? 'data' : 'report'}`
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Проверяет есть ли актуальный кэш для отчета
 * Временная версия с in-memory кэшем
 */
export async function getCachedReport(
  userId: string,
  accountId: string,
  timeRange: string,
  campaignId?: string | null,
  reportType: 'weekly' | 'regular' = 'regular', // Add report type parameter
  dataOnly = false, // Add dataOnly parameter
): Promise<string | null> {
  const cacheKey = generateCacheKey(
    userId,
    accountId,
    timeRange,
    campaignId,
    reportType,
    dataOnly,
  )

  // 1. Пытаемся получить из Supabase
  try {
    const { data, error } = await db
      .from('google_ads_reports_cache')
      .select('report_content, expires_at')
      .eq('cache_key', cacheKey)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) {
      // Если таблицы нет или другая ошибка – логируем и переходим к памяти
      console.warn('Supabase cache query error, falling back to memory:', error)
    }

    if (data) {
      if (new Date(data.expires_at) > new Date()) {
        console.log('Cache hit (Supabase)')
        return data.report_content
      }

      // Запись истекла – удаляем
      await db
        .from('google_ads_reports_cache')
        .delete()
        .eq('cache_key', cacheKey)
        .eq('user_id', userId)
    }
  } catch (dbErr) {
    console.warn('Error querying Supabase cache:', dbErr)
  }

  // 2. Fallback: in-memory cache
  const mem = memoryCache.get(cacheKey)
  if (mem && mem.expires_at > new Date() && mem.user_id === userId) {
    console.log('Cache hit (memory)')
    return mem.report_content
  }

  console.log('Cache miss')
  return null
}

/**
 * Сохраняет отчет в кэш
 * Временная версия с in-memory кэшем
 */
export async function setCachedReport(
  params: CreateCacheEntryParams & { dataOnly?: boolean },
): Promise<boolean> {
  if (!params.userId) {
    return false
  }

  const cacheKey = generateCacheKey(
    params.userId,
    params.accountId,
    params.timeRange,
    params.campaignId,
    params.reportType,
    params.dataOnly ?? false,
  )

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  try {
    const dbEntry: any = {
      user_id: params.userId,
      account_id: params.accountId,
      time_range: params.timeRange,
      campaign_id: params.campaignId ?? null,
      report_content: params.reportContent,
      cache_key: cacheKey,
      expires_at: expiresAt.toISOString(),
    }

    if (params.performanceCharts) {
      dbEntry.performance_charts = params.performanceCharts
    }
    if (typeof params.activeCampaigns === 'number') {
      dbEntry.active_campaigns = params.activeCampaigns
    }
    if (typeof params.averageRoas === 'number') {
      dbEntry.average_roas = params.averageRoas
    }
    if (params.recentActivity) {
      dbEntry.recent_activity = params.recentActivity
    }

    const { error } = await db
      .from('google_ads_reports_cache')
      .upsert(dbEntry, { onConflict: 'cache_key' })

    if (error) {
      console.warn('Supabase cache upsert error, saving to memory:', error)
      throw error
    }

    console.log('Report cached in Supabase DB')
    return true
  } catch (err) {
    // fallback to memory
    memoryCache.set(cacheKey, {
      report_content: params.reportContent,
      expires_at: expiresAt,
      user_id: params.userId,
    })
    console.log('Report cached in memory as fallback')
    return true
  }
}

/**
 * Очищает истекшие записи кэша
 * Временная версия с in-memory кэшем
 */
export async function cleanupExpiredCache(): Promise<number> {
  // сначала пытаемся через Supabase функцию-утилиту, если есть
  try {
    const { data, error } = await db.rpc(
      'cleanup_expired_google_ads_reports_cache',
    )

    if (!error && typeof data === 'number') {
      console.log(`Cleaned up ${data} expired cache entries (Supabase)`)
      return data
    }
    if (error) {
      console.warn('Supabase cleanup RPC error:', error)
    }
  } catch (err) {
    console.warn('Supabase cleanup RPC exception:', err)
  }

  // fall back to memory
  const now = new Date()
  let deleted = 0
  for (const [key, entry] of Array.from(memoryCache.entries())) {
    if (entry.expires_at <= now) {
      memoryCache.delete(key)
      deleted++
    }
  }
  return deleted
}

/**
 * Удаляет все записи кэша для пользователя
 * Временная версия с in-memory кэшем
 */
export async function clearUserCache(userId: string): Promise<boolean> {
  try {
    const { error } = await db
      .from('google_ads_reports_cache')
      .delete()
      .eq('user_id', userId)

    if (!error) {
      return true
    }
    console.warn('Supabase clear user cache error:', error)
  } catch (err) {
    console.warn('Supabase clear user cache exception:', err)
  }

  // fallback to memory
  for (const [key, entry] of Array.from(memoryCache.entries())) {
    if (entry.user_id === userId) {
      memoryCache.delete(key)
    }
  }
  return true
}
