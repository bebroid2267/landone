-- Create table for tracking report usage
CREATE TABLE report_usage (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  report_type text NOT NULL DEFAULT 'ai_analysis', -- 'ai_analysis', 'weekly_analysis'
  account_id text,
  time_range text,
  campaign_id text,
  generated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  week_start date NOT NULL, -- Start of the week for this report (Monday)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for report_usage
ALTER TABLE report_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own report usage" ON report_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own report usage" ON report_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_report_usage_user_week ON report_usage (user_id, week_start);
CREATE INDEX idx_report_usage_user_generated ON report_usage (user_id, generated_at);

-- Function to get the start of the current week (Monday)
CREATE OR REPLACE FUNCTION get_week_start(input_date timestamp with time zone DEFAULT timezone('utc'::text, now()))
RETURNS date AS $$
BEGIN
  -- Get Monday of the week containing input_date
  RETURN (input_date::date - (EXTRACT(dow FROM input_date)::integer - 1) % 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user has reached weekly report limit
CREATE OR REPLACE FUNCTION check_weekly_report_limit(
  p_user_id uuid,
  p_limit integer DEFAULT 100
)
RETURNS json AS $$
DECLARE
  current_week_start date;
  current_usage integer;
  result json;
BEGIN
  -- Get current week start
  current_week_start := get_week_start();
  
  -- Count reports generated this week
  SELECT COUNT(*)
  INTO current_usage
  FROM report_usage
  WHERE user_id = p_user_id 
    AND week_start = current_week_start;
  
  -- Build result
  result := json_build_object(
    'can_generate', current_usage < p_limit,
    'current_usage', current_usage,
    'limit', p_limit,
    'remaining', GREATEST(0, p_limit - current_usage),
    'week_start', current_week_start,
    'resets_at', current_week_start + interval '7 days'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record report generation
CREATE OR REPLACE FUNCTION record_report_usage(
  p_user_id uuid,
  p_report_type text DEFAULT 'ai_analysis',
  p_account_id text DEFAULT NULL,
  p_time_range text DEFAULT NULL,
  p_campaign_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
  current_week_start date;
BEGIN
  -- Get current week start
  current_week_start := get_week_start();
  
  -- Insert new usage record
  INSERT INTO report_usage (
    user_id,
    report_type,
    account_id,
    time_range,
    campaign_id,
    week_start
  )
  VALUES (
    p_user_id,
    p_report_type,
    p_account_id,
    p_time_range,
    p_campaign_id,
    current_week_start
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's weekly usage statistics
CREATE OR REPLACE FUNCTION get_user_weekly_stats(
  p_user_id uuid,
  p_weeks_back integer DEFAULT 4
)
RETURNS json AS $$
DECLARE
  stats json;
BEGIN
  WITH weekly_stats AS (
    SELECT 
      week_start,
      COUNT(*) as reports_count,
      COUNT(DISTINCT report_type) as report_types,
      array_agg(DISTINCT report_type) as types_used
    FROM report_usage
    WHERE user_id = p_user_id 
      AND week_start >= (get_week_start() - (p_weeks_back * 7))
    GROUP BY week_start
    ORDER BY week_start DESC
  )
  SELECT json_agg(
    json_build_object(
      'week_start', week_start,
      'reports_count', reports_count,
      'report_types', report_types,
      'types_used', types_used
    )
  )
  INTO stats
  FROM weekly_stats;
  
  RETURN COALESCE(stats, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old usage records (keep last 12 weeks)
CREATE OR REPLACE FUNCTION cleanup_old_report_usage()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
  cutoff_date date;
BEGIN
  -- Keep last 12 weeks of data
  cutoff_date := get_week_start() - (12 * 7);
  
  DELETE FROM report_usage 
  WHERE week_start < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;