-- Function to get Google Ads tokens
CREATE OR REPLACE FUNCTION get_google_ads_tokens(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.user_id,
    g.access_token,
    g.refresh_token,
    g.expires_at,
    g.created_at,
    g.updated_at
  FROM 
    google_ads_tokens g
  WHERE 
    g.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update Google Ads tokens
CREATE OR REPLACE FUNCTION update_google_ads_tokens(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
) RETURNS VOID SECURITY DEFINER
AS $$
BEGIN
  UPDATE google_ads_tokens
  SET 
    access_token = p_access_token,
    refresh_token = p_refresh_token,
    expires_at = p_expires_at,
    updated_at = now()
  WHERE 
    user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert Google Ads tokens
CREATE OR REPLACE FUNCTION insert_google_ads_tokens(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
) RETURNS VOID SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO google_ads_tokens (
    user_id,
    access_token,
    refresh_token,
    expires_at
  ) VALUES (
    p_user_id,
    p_access_token,
    p_refresh_token,
    p_expires_at
  );
END;
$$ LANGUAGE plpgsql;

-- Function to delete Google Ads accounts for a user
CREATE OR REPLACE FUNCTION delete_google_ads_accounts(
  p_user_id UUID
) RETURNS VOID SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM google_ads_accounts
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert a Google Ads account
CREATE OR REPLACE FUNCTION insert_google_ads_account(
  p_user_id UUID,
  p_account_id TEXT,
  p_account_name TEXT DEFAULT NULL
) RETURNS VOID SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO google_ads_accounts (
    user_id,
    account_id,
    account_name
  ) VALUES (
    p_user_id,
    p_account_id,
    p_account_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get Google Ads accounts for a user
CREATE OR REPLACE FUNCTION get_google_ads_accounts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  account_id TEXT,
  account_name TEXT,
  currency_code TEXT,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.user_id,
    g.account_id,
    g.account_name,
    g.currency_code,
    g.timezone,
    g.created_at,
    g.updated_at
  FROM 
    google_ads_accounts g
  WHERE 
    g.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql; 