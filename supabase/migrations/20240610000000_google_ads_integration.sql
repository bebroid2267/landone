-- Create Google Ads tokens table
CREATE TABLE google_ads_tokens (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for google_ads_tokens
ALTER TABLE google_ads_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own Google Ads tokens" ON google_ads_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own Google Ads tokens" ON google_ads_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own Google Ads tokens" ON google_ads_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own Google Ads tokens" ON google_ads_tokens FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_google_ads_tokens_updated_at
  BEFORE UPDATE ON google_ads_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create table for storing Google Ads account info
CREATE TABLE google_ads_accounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  account_id text NOT NULL,
  account_name text,
  currency_code text,
  timezone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for google_ads_accounts
ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own Google Ads accounts" ON google_ads_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own Google Ads accounts" ON google_ads_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own Google Ads accounts" ON google_ads_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own Google Ads accounts" ON google_ads_accounts FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_google_ads_accounts_updated_at
  BEFORE UPDATE ON google_ads_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 