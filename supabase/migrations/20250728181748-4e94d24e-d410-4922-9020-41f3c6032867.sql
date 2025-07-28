-- Create database functions table
CREATE TABLE public.database_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  function_type TEXT NOT NULL CHECK (function_type IN ('plpgsql', 'edge', 'cron')),
  parameters JSONB DEFAULT '[]'::jsonb,
  return_type TEXT,
  function_body TEXT,
  is_edge_function BOOLEAN DEFAULT false,
  edge_function_name TEXT,
  cron_schedule TEXT,
  is_cron_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_id UUID NOT NULL
);

-- Create database triggers table
CREATE TABLE public.database_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
  trigger_timing TEXT NOT NULL CHECK (trigger_timing IN ('BEFORE', 'AFTER', 'INSTEAD OF')),
  function_id UUID REFERENCES public.database_functions(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_id UUID NOT NULL
);

-- Enable RLS on both tables
ALTER TABLE public.database_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_triggers ENABLE ROW LEVEL SECURITY;

-- Create policies for database_functions
CREATE POLICY "Users can view functions for accessible projects" 
ON public.database_functions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_functions.project_id 
    AND (p.user_id = auth.uid() OR p.is_public = true OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create functions for their projects" 
ON public.database_functions 
FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_functions.project_id 
    AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
  )
);

CREATE POLICY "Users can update functions they created or have edit access" 
ON public.database_functions 
FOR UPDATE 
USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_functions.project_id 
    AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
  )
);

CREATE POLICY "Users can delete functions they created or have edit access" 
ON public.database_functions 
FOR DELETE 
USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_functions.project_id 
    AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
  )
);

-- Create policies for database_triggers
CREATE POLICY "Users can view triggers for accessible projects" 
ON public.database_triggers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_triggers.project_id 
    AND (p.user_id = auth.uid() OR p.is_public = true OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create triggers for their projects" 
ON public.database_triggers 
FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_triggers.project_id 
    AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
  )
);

CREATE POLICY "Users can update triggers they created or have edit access" 
ON public.database_triggers 
FOR UPDATE 
USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_triggers.project_id 
    AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
  )
);

CREATE POLICY "Users can delete triggers they created or have edit access" 
ON public.database_triggers 
FOR DELETE 
USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.database_projects p
    LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
    WHERE p.id = database_triggers.project_id 
    AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
  )
);

-- Create indexes for better performance
CREATE INDEX idx_database_functions_project_id ON public.database_functions(project_id);
CREATE INDEX idx_database_functions_function_type ON public.database_functions(function_type);
CREATE INDEX idx_database_triggers_project_id ON public.database_triggers(project_id);
CREATE INDEX idx_database_triggers_table_name ON public.database_triggers(table_name);
CREATE INDEX idx_database_triggers_function_id ON public.database_triggers(function_id);

-- Add update timestamp triggers
CREATE TRIGGER update_database_functions_updated_at
BEFORE UPDATE ON public.database_functions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_triggers_updated_at
BEFORE UPDATE ON public.database_triggers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();