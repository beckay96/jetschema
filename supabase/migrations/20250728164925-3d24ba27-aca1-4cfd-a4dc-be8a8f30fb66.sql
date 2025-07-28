-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_project(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = project_uuid 
    AND (
      p.user_id = user_uuid OR
      (tm.user_id = user_uuid AND tm.role IN ('owner', 'admin', 'editor'))
    )
  );
$$;

-- Add RLS policy for team_invitations that was missing
CREATE POLICY "Users can view invitations to teams they admin or for their email" 
ON public.team_invitations FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_invitations.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team owners and admins can create invitations" 
ON public.team_invitations FOR INSERT 
WITH CHECK (
  auth.uid() = invited_by AND
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_invitations.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team owners and admins can update invitations" 
ON public.team_invitations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_invitations.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);