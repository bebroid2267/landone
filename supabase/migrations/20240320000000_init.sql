-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);
CREATE TYPE image_format AS ENUM ('jpeg', 'png', 'webp');

-- Drop images table if exists
DROP TABLE IF EXISTS images;

-- Create users table
CREATE TABLE users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  avatar_url text,
  email text,
  billing_address jsonb,
  payment_method jsonb,
  utm_source text
);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own user data." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON users FOR UPDATE USING (auth.uid() = id);

-- Create customers table
CREATE TABLE customers (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  stripe_customer_id text
);

-- Enable RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE products (
  id text PRIMARY KEY,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON products FOR SELECT USING (true);

-- Create prices table
CREATE TABLE prices (
  id text PRIMARY KEY,
  product_id text REFERENCES products,
  active boolean,
  description text,
  unit_amount bigint,
  currency text CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);

-- Enable RLS for prices
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON prices FOR SELECT USING (true);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  status subscription_status,
  metadata jsonb,
  price_id text REFERENCES prices,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);

-- Enable RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subs data." ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Create images table
CREATE TABLE images (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES users,
  title text,
  prompt text,
  negative_prompt text,
  image_url text,
  thumbnail_url text,
  width integer,
  height integer,
  model text,
  model_style text,
  steps integer,
  seed integer,
  cfg_scale float,
  status text DEFAULT 'pending',
  format image_format DEFAULT 'png',
  created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
  metadata jsonb,
  short_id TEXT NOT NULL
);

-- Enable RLS for images
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own images" ON images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON images FOR DELETE USING (auth.uid() = user_id);

-- Add comment for the column
COMMENT ON COLUMN images.short_id IS 'Short nanoid for friendly URLs';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE products, prices;

-- Add unique index to short_id
CREATE UNIQUE INDEX images_short_id_key ON images (short_id); 