-- Drop the function if it exists to ensure we can recreate it
DROP FUNCTION IF EXISTS public.add_team_owner(uuid, uuid);

-- Function to add a team owner without triggering RLS recursion
-- This function runs with security definer privileges which means it bypasses RLS
CREATE OR REPLACE FUNCTION public.add_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the team member record directly
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (p_team_id, p_user_id, 'owner');
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_team_owner(uuid, uuid) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION public.add_team_owner IS 
  'Adds a user as a team owner, bypassing RLS policies to avoid infinite recursion';

-- Verify function creation
DO $$
BEGIN
  RAISE NOTICE 'Function add_team_owner created successfully';
  
  -- Check if function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE proname = 'add_team_owner'
    AND nspname = 'public'
  ) THEN
    RAISE NOTICE 'Function verification: add_team_owner exists in database';
  ELSE
    RAISE EXCEPTION 'Function verification failed: add_team_owner does not exist';
  END IF;
END;
$$;
