-- Create table for caching Google Ads AI reports
CREATE TABLE google_ads_reports_cache (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  account_id text NOT NULL,
  time_range text NOT NULL,
  campaign_id text,
  report_content text NOT NULL,
  cache_key text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- Enable RLS for google_ads_reports_cache
ALTER TABLE google_ads_reports_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports cache" ON google_ads_reports_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports cache" ON google_ads_reports_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports cache" ON google_ads_reports_cache FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports cache" ON google_ads_reports_cache FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_google_ads_reports_cache_updated_at
  BEFORE UPDATE ON google_ads_reports_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_google_ads_reports_cache_key ON google_ads_reports_cache (cache_key);
CREATE INDEX idx_google_ads_reports_cache_user_expires ON google_ads_reports_cache (user_id, expires_at);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_google_ads_reports_cache()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM google_ads_reports_cache 
  WHERE expires_at < timezone('utc'::text, now());
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate cache key
CREATE OR REPLACE FUNCTION generate_google_ads_cache_key(
  p_user_id uuid,
  p_account_id text,
  p_time_range text,
  p_campaign_id text DEFAULT NULL
)
RETURNS text AS $$
BEGIN
  RETURN encode(
    digest(
      concat(
        p_user_id::text, 
        ':', p_account_id, 
        ':', p_time_range, 
        ':', COALESCE(p_campaign_id, 'null')
      ), 
      'sha256'
    ), 
    'hex'
  );
END;
$$ LANGUAGE plpgsql; 