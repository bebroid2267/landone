-- Add dashboard-related fields to google_ads_reports_cache
-- This migration adds columns for storing pre-aggregated metrics and UI-ready data
-- to speed up dashboard load times.

ALTER TABLE IF EXISTS public.google_ads_reports_cache
    ADD COLUMN IF NOT EXISTS performance_charts jsonb,
    ADD COLUMN IF NOT EXISTS active_campaigns integer,
    ADD COLUMN IF NOT EXISTS average_roas numeric,
    ADD COLUMN IF NOT EXISTS recent_activity jsonb; 