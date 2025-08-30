-- Create forms table for storing contact form submissions
CREATE TABLE forms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  monthly_ad_spend text NOT NULL,
  phone_number text NOT NULL,
  company_website text,
  form_type text DEFAULT 'talk_to_expert' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for forms table
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for forms table
-- Users can insert their own forms
CREATE POLICY "Users can insert their own forms" ON forms
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own forms
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all forms (you can adjust this based on your admin logic)
-- CREATE POLICY "Admins can view all forms" ON forms
--   FOR SELECT 
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for better performance
CREATE INDEX forms_user_id_idx ON forms(user_id);
CREATE INDEX forms_created_at_idx ON forms(created_at);
CREATE INDEX forms_form_type_idx ON forms(form_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();