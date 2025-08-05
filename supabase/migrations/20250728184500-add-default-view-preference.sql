-- Add default_view column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_view TEXT CHECK (default_view IN ('diagram', 'table')) DEFAULT 'diagram';

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.default_view IS 'User''s preferred default view for new projects (diagram or table)';
