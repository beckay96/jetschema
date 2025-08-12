-- Already run 

-- Add username fields to unified_comments table to simplify display
-- This eliminates the need for complex joins with profiles table

ALTER TABLE unified_comments 
ADD COLUMN author_name TEXT,
ADD COLUMN author_email TEXT,
ADD COLUMN author_avatar_url TEXT;

-- Update existing comments with author information from profiles
-- This is a one-time migration to populate existing data
UPDATE unified_comments 
SET 
  author_name = profiles.display_name,
  author_email = profiles.email,
  author_avatar_url = profiles.avatar_url
FROM profiles 
WHERE unified_comments.author_id = profiles.user_id;

-- For any comments without profile matches, use email from auth.users
UPDATE unified_comments 
SET 
  author_email = auth.users.email,
  author_name = COALESCE(author_name, auth.users.email)
FROM auth.users 
WHERE unified_comments.author_id = auth.users.id 
  AND unified_comments.author_email IS NULL;

-- Add comment explaining the change
COMMENT ON COLUMN unified_comments.author_name IS 'Cached display name of comment author for performance';
COMMENT ON COLUMN unified_comments.author_email IS 'Cached email of comment author for performance'; 
COMMENT ON COLUMN unified_comments.author_avatar_url IS 'Cached avatar URL of comment author for performance';
