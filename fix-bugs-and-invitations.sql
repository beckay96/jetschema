-- Fix for bug reports and team invitations
-- This script addresses two main issues:
-- 1. Missing storage bucket for bug report image uploads
-- 2. Foreign key constraint errors with profiles table

-- PART 1: Fix profiles table issues
-- First, ensure the profiles table has the correct structure and triggers

-- Check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create or replace the trigger to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PART 2: Fix RLS policies for profiles and team_invitations

-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create permissive policies for profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix team_invitations policies
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Invited users can view their invitations" ON public.team_invitations;

-- Create permissive policies for team_invitations
CREATE POLICY "Authenticated users can view team invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team admins can create invitations"
  ON public.team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Invited users can update their invitations"
  ON public.team_invitations FOR UPDATE
  TO authenticated
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- PART 3: Fix user_feedback table and foreign key constraints

-- Create or update the user_feedback table with correct constraints
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  feature TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  author_id UUID NOT NULL,
  screenshot_url TEXT,
  browser_logs JSONB,
  browser_info JSONB,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create permissive RLS policy for user_feedback
DROP POLICY IF EXISTS "Users can submit feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view feedback" ON public.user_feedback;

CREATE POLICY "Users can submit feedback"
  ON public.user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can view feedback"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (true);

-- PART 4: Create storage bucket for feedback images if it doesn't exist
-- Note: This can't be done in SQL directly, must be done via Supabase dashboard or API
-- The following is a reminder for manual action:

/*
MANUAL ACTION REQUIRED:
1. Go to Supabase dashboard > Storage
2. Create a new bucket named 'feedback-images'
3. Set the following permissions:
   - Public bucket: No
   - RLS enabled: Yes
4. Add the following storage policies:
   - Policy for uploads: 
     - Name: "Authenticated users can upload images"
     - Definition: (role() = 'authenticated')
   - Policy for downloads:
     - Name: "Anyone can view images"
     - Definition: (true)
*/
