-- Migration for ROI Arena tables
-- Creates tables for challenges and weekly leaderboard

-- Create enum for challenge difficulty
CREATE TYPE challenge_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create enum for challenge status
CREATE TYPE challenge_status AS ENUM ('not_started', 'in_progress', 'completed', 'failed');

-- Create challenges table (master list of all available challenges)
CREATE TABLE public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_metric TEXT NOT NULL, -- e.g., 'ROAS', 'CTR', 'Conversions'
  target_value DECIMAL(10,2) NOT NULL, -- target value to achieve
  target_operator TEXT NOT NULL DEFAULT '>=', -- '>=', '<=', '='
  reward_points INTEGER NOT NULL DEFAULT 0,
  difficulty challenge_difficulty NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7, -- challenge duration in days
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_challenges table (tracks user progress on challenges)
CREATE TABLE public.user_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  status challenge_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE, -- calculated based on started_at + duration_days
  current_value DECIMAL(10,2), -- current metric value
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, challenge_id)
);

-- Create weekly_leaderboard table
CREATE TABLE public.weekly_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  week_end_date DATE NOT NULL, -- Sunday of the week
  total_points INTEGER NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  average_roas DECIMAL(10,2),
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, week_start_date)
);

-- Create indexes for better performance
CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON public.user_challenges(status);
CREATE INDEX idx_user_challenges_deadline ON public.user_challenges(deadline);
CREATE INDEX idx_weekly_leaderboard_week ON public.weekly_leaderboard(week_start_date, week_end_date);
CREATE INDEX idx_weekly_leaderboard_points ON public.weekly_leaderboard(total_points DESC);
CREATE INDEX idx_weekly_leaderboard_rank ON public.weekly_leaderboard(rank_position);

-- Enable Row Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read access)
CREATE POLICY "Allow public read access to challenges" ON public.challenges
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_challenges (users can only see their own challenges)
CREATE POLICY "Users can view own challenges" ON public.user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON public.user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON public.user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for weekly_leaderboard (public read access for leaderboard display)
CREATE POLICY "Allow public read access to leaderboard" ON public.weekly_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own leaderboard entries" ON public.weekly_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entries" ON public.weekly_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically set deadline when challenge is started
CREATE OR REPLACE FUNCTION set_challenge_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set deadline when status changes to 'in_progress' and started_at is set
  IF NEW.status = 'in_progress' AND NEW.started_at IS NOT NULL AND OLD.deadline IS NULL THEN
    SELECT started_at + (duration_days || ' days')::INTERVAL
    INTO NEW.deadline
    FROM public.challenges
    WHERE id = NEW.challenge_id;
  END IF;
  
  -- Update progress percentage based on current_value and target
  IF NEW.current_value IS NOT NULL THEN
    DECLARE
      target_val DECIMAL(10,2);
      target_op TEXT;
    BEGIN
      SELECT target_value, target_operator
      INTO target_val, target_op
      FROM public.challenges
      WHERE id = NEW.challenge_id;
      
      -- Calculate progress based on operator type
      IF target_op = '>=' THEN
        NEW.progress_percentage = LEAST(100, GREATEST(0, (NEW.current_value / target_val * 100)::INTEGER));
      ELSIF target_op = '<=' THEN
        NEW.progress_percentage = LEAST(100, GREATEST(0, ((target_val - NEW.current_value) / target_val * 100)::INTEGER));
      ELSE -- '='
        NEW.progress_percentage = CASE WHEN NEW.current_value = target_val THEN 100 ELSE 0 END;
      END IF;
      
      -- Auto-complete challenge if target is reached
      IF (target_op = '>=' AND NEW.current_value >= target_val) OR
         (target_op = '<=' AND NEW.current_value <= target_val) OR
         (target_op = '=' AND NEW.current_value = target_val) THEN
        NEW.status = 'completed';
        NEW.completed_at = timezone('utc'::text, now());
        SELECT reward_points INTO NEW.points_earned FROM public.challenges WHERE id = NEW.challenge_id;
      END IF;
    END;
  END IF;
  
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_challenges
CREATE TRIGGER trigger_set_challenge_deadline
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION set_challenge_deadline();

-- Function to update weekly leaderboard
CREATE OR REPLACE FUNCTION update_weekly_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  week_start DATE;
  week_end DATE;
  user_total_points INTEGER;
  user_challenges_completed INTEGER;
BEGIN
  -- Calculate current week (Monday to Sunday)
  week_start = date_trunc('week', CURRENT_DATE)::DATE;
  week_end = week_start + INTERVAL '6 days';
  
  -- Calculate user's total points and completed challenges for the week
  SELECT 
    COALESCE(SUM(points_earned), 0),
    COUNT(*)
  INTO user_total_points, user_challenges_completed
  FROM public.user_challenges
  WHERE user_id = NEW.user_id
    AND status = 'completed'
    AND completed_at >= week_start
    AND completed_at <= week_end + INTERVAL '1 day';
  
  -- Insert or update weekly leaderboard entry
  INSERT INTO public.weekly_leaderboard (
    user_id,
    week_start_date,
    week_end_date,
    total_points,
    challenges_completed
  )
  VALUES (
    NEW.user_id,
    week_start,
    week_end,
    user_total_points,
    user_challenges_completed
  )
  ON CONFLICT (user_id, week_start_date)
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    challenges_completed = EXCLUDED.challenges_completed,
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update leaderboard when challenges are completed
CREATE TRIGGER trigger_update_weekly_leaderboard
  AFTER UPDATE ON public.user_challenges
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_weekly_leaderboard();

-- Insert sample challenges
INSERT INTO public.challenges (title, description, target_metric, target_value, target_operator, reward_points, difficulty, duration_days) VALUES
('ROAS Optimizer', 'Achieve a Return on Ad Spend of 4.0 or higher', 'ROAS', 4.00, '>=', 100, 'beginner', 7),
('Click Master', 'Reach a Click-Through Rate of 3.5% or higher', 'CTR', 3.50, '>=', 150, 'beginner', 7),
('Conversion Champion', 'Generate 50 or more conversions', 'Conversions', 50.00, '>=', 200, 'intermediate', 14),
('Revenue Booster', 'Achieve $10,000 in revenue', 'Revenue', 10000.00, '>=', 300, 'intermediate', 14),
('Efficiency Expert', 'Maintain Cost Per Conversion below $20', 'CPC', 20.00, '<=', 250, 'advanced', 21),
('Quality Score Hero', 'Achieve average Quality Score of 8.0 or higher', 'Quality Score', 8.00, '>=', 400, 'advanced', 21),
('Impression Leader', 'Generate 100,000 impressions', 'Impressions', 100000.00, '>=', 150, 'beginner', 7),
('Budget Master', 'Achieve target ROAS while spending full daily budget', 'Budget Utilization', 95.00, '>=', 350, 'advanced', 14);

-- Function to calculate and update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings()
RETURNS void AS $$
BEGIN
  -- Update rankings for current week
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, challenges_completed DESC) as new_rank
    FROM public.weekly_leaderboard
    WHERE week_start_date = date_trunc('week', CURRENT_DATE)::DATE
  )
  UPDATE public.weekly_leaderboard
  SET rank_position = ranked_users.new_rank,
      updated_at = timezone('utc'::text, now())
  FROM ranked_users
  WHERE public.weekly_leaderboard.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to update rankings (this would typically be run via cron or pg_cron)
-- For now, we'll just create the function and it can be called manually or via API