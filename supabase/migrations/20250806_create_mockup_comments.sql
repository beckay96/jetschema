-- Create mockup_comments table
CREATE TABLE IF NOT EXISTS public.mockup_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mockup_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID NOT NULL REFERENCES public.database_projects(id),
  content TEXT NOT NULL,
  annotations JSONB,
  is_task BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.mockup_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own comments or comments on projects they have access to
CREATE POLICY "Users can view mockup comments for their projects" 
  ON public.mockup_comments 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.team_id IN (
        SELECT team_id FROM public.database_projects 
        WHERE id = mockup_comments.project_id
      )
    )
  );

-- Allow users to insert their own comments
CREATE POLICY "Users can insert their own comments" 
  ON public.mockup_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
  ON public.mockup_comments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON public.mockup_comments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX mockup_comments_mockup_id_idx ON public.mockup_comments (mockup_id);
CREATE INDEX mockup_comments_project_id_idx ON public.mockup_comments (project_id);
CREATE INDEX mockup_comments_user_id_idx ON public.mockup_comments (user_id);
