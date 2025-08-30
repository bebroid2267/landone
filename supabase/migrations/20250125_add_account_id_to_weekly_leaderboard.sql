-- Add account_id column to weekly_leaderboard table
-- This will store the Google Ads account ID for display in the leaderboard

ALTER TABLE public.weekly_leaderboard 
ADD COLUMN account_id TEXT;

-- Create index for better performance when querying by account_id
CREATE INDEX idx_weekly_leaderboard_account_id ON public.weekly_leaderboard(account_id);