-- Add invited_user_id column to team_invitations for in-app notifications
-- This allows us to directly reference the invited user without relying on email lookup

ALTER TABLE team_invitations 
ADD COLUMN IF NOT EXISTS invited_user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups of invitations by user
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_user_id 
ON team_invitations(invited_user_id);

-- Create index for faster lookups of pending invitations
CREATE INDEX IF NOT EXISTS idx_team_invitations_pending 
ON team_invitations(invited_user_id, accepted_at) 
WHERE accepted_at IS NULL;

-- Update RLS policies for team_invitations to support in-app notifications
-- Allow users to see invitations sent to them
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON team_invitations;
CREATE POLICY "Users can view invitations sent to them" ON team_invitations
FOR SELECT USING (
  invited_user_id = auth.uid() OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow users to update (accept) invitations sent to them
DROP POLICY IF EXISTS "Users can accept invitations sent to them" ON team_invitations;
CREATE POLICY "Users can accept invitations sent to them" ON team_invitations
FOR UPDATE USING (
  invited_user_id = auth.uid() OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Comment on the new column
COMMENT ON COLUMN team_invitations.invited_user_id IS 'Direct reference to the invited user for in-app notifications. Null for legacy email-based invitations.';
