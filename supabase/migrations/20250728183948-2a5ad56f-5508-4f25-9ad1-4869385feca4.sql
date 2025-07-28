-- Create database_policies table for RLS policy management
CREATE TABLE public.database_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  command TEXT NOT NULL CHECK (command IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')),
  role TEXT,
  using_expression TEXT,
  with_check_expression TEXT,
  is_permissive BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  project_id UUID NOT NULL,
  author_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create database_indexes table for index management
CREATE TABLE public.database_indexes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  columns TEXT[] NOT NULL,
  index_type TEXT NOT NULL DEFAULT 'BTREE' CHECK (index_type IN ('BTREE', 'HASH', 'GIN', 'GIST', 'SPGIST', 'BRIN')),
  is_unique BOOLEAN NOT NULL DEFAULT false,
  is_partial BOOLEAN NOT NULL DEFAULT false,
  where_clause TEXT,
  description TEXT,
  project_id UUID NOT NULL,
  author_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create database_validations table for validation results
CREATE TABLE public.database_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  validation_type TEXT NOT NULL CHECK (validation_type IN ('error', 'warning', 'info')),
  message TEXT NOT NULL,
  suggestion TEXT,
  affected_element_type TEXT CHECK (affected_element_type IN ('table', 'field', 'relationship')),
  affected_element_id TEXT,
  affected_element_name TEXT,
  project_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.database_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_validations ENABLE ROW LEVEL SECURITY;

-- RLS policies for database_policies
CREATE POLICY "Users can view policies for accessible projects" 
ON public.database_policies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_policies.project_id 
  AND (p.user_id = auth.uid() OR p.is_public = true OR tm.user_id = auth.uid())
));

CREATE POLICY "Users can create policies for their projects" 
ON public.database_policies 
FOR INSERT 
WITH CHECK (auth.uid() = author_id AND EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_policies.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

CREATE POLICY "Users can update policies they created or have edit access" 
ON public.database_policies 
FOR UPDATE 
USING (auth.uid() = author_id OR EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_policies.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

CREATE POLICY "Users can delete policies they created or have edit access" 
ON public.database_policies 
FOR DELETE 
USING (auth.uid() = author_id OR EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_policies.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

-- RLS policies for database_indexes
CREATE POLICY "Users can view indexes for accessible projects" 
ON public.database_indexes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_indexes.project_id 
  AND (p.user_id = auth.uid() OR p.is_public = true OR tm.user_id = auth.uid())
));

CREATE POLICY "Users can create indexes for their projects" 
ON public.database_indexes 
FOR INSERT 
WITH CHECK (auth.uid() = author_id AND EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_indexes.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

CREATE POLICY "Users can update indexes they created or have edit access" 
ON public.database_indexes 
FOR UPDATE 
USING (auth.uid() = author_id OR EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_indexes.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

CREATE POLICY "Users can delete indexes they created or have edit access" 
ON public.database_indexes 
FOR DELETE 
USING (auth.uid() = author_id OR EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_indexes.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

-- RLS policies for database_validations
CREATE POLICY "Users can view validations for accessible projects" 
ON public.database_validations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_validations.project_id 
  AND (p.user_id = auth.uid() OR p.is_public = true OR tm.user_id = auth.uid())
));

CREATE POLICY "Users can create validations for their projects" 
ON public.database_validations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.database_projects p
  LEFT JOIN public.team_members tm ON p.team_id = tm.team_id
  WHERE p.id = database_validations.project_id 
  AND (p.user_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')))
));

-- Add indexes for better performance
CREATE INDEX idx_database_policies_project_id ON public.database_policies(project_id);
CREATE INDEX idx_database_policies_table_name ON public.database_policies(table_name);
CREATE INDEX idx_database_policies_author_id ON public.database_policies(author_id);

CREATE INDEX idx_database_indexes_project_id ON public.database_indexes(project_id);
CREATE INDEX idx_database_indexes_table_name ON public.database_indexes(table_name);
CREATE INDEX idx_database_indexes_author_id ON public.database_indexes(author_id);

CREATE INDEX idx_database_validations_project_id ON public.database_validations(project_id);
CREATE INDEX idx_database_validations_type ON public.database_validations(validation_type);

-- Add updated_at triggers
CREATE TRIGGER update_database_policies_updated_at
  BEFORE UPDATE ON public.database_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_indexes_updated_at
  BEFORE UPDATE ON public.database_indexes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_validations_updated_at
  BEFORE UPDATE ON public.database_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();