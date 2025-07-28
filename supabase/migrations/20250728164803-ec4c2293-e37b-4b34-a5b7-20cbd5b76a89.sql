-- Create user roles enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Create field comments table
CREATE TABLE public.field_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.database_projects(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table  
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.database_projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  tagged_fields JSONB DEFAULT '[]'::jsonb, -- Array of {table_name, field_name} objects
  reply_to_message_id UUID REFERENCES public.chat_messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add team_id to database_projects table FIRST
ALTER TABLE public.database_projects ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create helper function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
$$;

-- Create helper function to check if user can edit project (NOW with team_id column existing)
CREATE OR REPLACE FUNCTION public.can_edit_project(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
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

-- RLS Policies for teams
CREATE POLICY "Users can view teams they are members of" 
ON public.teams FOR SELECT 
USING (
  auth.uid() = created_by OR 
  public.is_team_member(id, auth.uid())
);

CREATE POLICY "Users can create teams" 
ON public.teams FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams" 
ON public.teams FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of teams they belong to" 
ON public.team_members FOR SELECT 
USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team owners and admins can manage members" 
ON public.team_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_members.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- RLS Policies for field_comments
CREATE POLICY "Users can view comments on projects they have access to" 
ON public.field_comments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = project_id 
    AND (
      p.user_id = auth.uid() OR 
      p.is_public = true OR
      tm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can create comments" 
ON public.field_comments FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = project_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view chat messages for projects they have access to" 
ON public.chat_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = project_id 
    AND (
      p.user_id = auth.uid() OR 
      tm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can create chat messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = project_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_comments_updated_at
  BEFORE UPDATE ON public.field_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();