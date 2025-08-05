-- Create unified_comments table to replace field_comments and support all object types
CREATE TABLE IF NOT EXISTS public.unified_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.database_projects(id),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  object_type TEXT NOT NULL, -- 'table', 'field', 'function', 'trigger', 'policy', 'mockup'
  object_id TEXT NOT NULL, -- ID or name of the object being commented on
  parent_object_id TEXT, -- For fields, triggers, policies: the parent table/function ID
  is_task BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.unified_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to select comments for projects they have access to
CREATE POLICY "Users can view comments for their projects" 
  ON public.unified_comments 
  FOR SELECT 
  USING (
    auth.uid() = author_id OR 
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.team_id IN (
        SELECT team_id FROM public.database_projects 
        WHERE id = unified_comments.project_id
      )
    )
  );

-- Allow users to insert their own comments
CREATE POLICY "Users can insert their own comments" 
  ON public.unified_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
  ON public.unified_comments 
  FOR UPDATE 
  USING (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON public.unified_comments 
  FOR DELETE 
  USING (auth.uid() = author_id);

-- Add indexes for performance
CREATE INDEX unified_comments_project_id_idx ON public.unified_comments (project_id);
CREATE INDEX unified_comments_object_type_idx ON public.unified_comments (object_type);
CREATE INDEX unified_comments_object_id_idx ON public.unified_comments (object_id);
CREATE INDEX unified_comments_parent_object_id_idx ON public.unified_comments (parent_object_id);
CREATE INDEX unified_comments_author_id_idx ON public.unified_comments (author_id);

-- Migration function to move data from field_comments to unified_comments
CREATE OR REPLACE FUNCTION migrate_field_comments() RETURNS void AS $$
BEGIN
  INSERT INTO public.unified_comments (
    project_id, 
    author_id, 
    content, 
    object_type, 
    object_id, 
    parent_object_id, 
    is_task, 
    completed, 
    created_at, 
    updated_at
  )
  SELECT 
    project_id,
    author_id,
    comment_text,
    'field',
    field_name,
    table_name,
    false, -- field_comments doesn't distinguish between comments and tasks
    is_completed,
    created_at,
    updated_at
  FROM public.field_comments;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_field_comments();

-- Drop migration function after use
DROP FUNCTION migrate_field_comments();

-- Create a view to maintain backward compatibility with field_comments
CREATE OR REPLACE VIEW public.field_comments_view AS
SELECT 
  author_id,
  content AS comment_text,
  created_at,
  object_id AS field_name,
  id,
  completed AS is_completed,
  false AS is_read, -- This field doesn't exist in unified_comments
  project_id,
  parent_object_id AS table_name,
  updated_at
FROM public.unified_comments
WHERE object_type = 'field';

-- Add trigger to maintain backward compatibility with field_comments view
CREATE OR REPLACE FUNCTION insert_field_comment() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.unified_comments (
    author_id,
    content,
    object_id,
    project_id,
    parent_object_id,
    object_type,
    completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.author_id,
    NEW.comment_text,
    NEW.field_name,
    NEW.project_id,
    NEW.table_name,
    'field',
    NEW.is_completed,
    NEW.created_at,
    NEW.updated_at
  )
  RETURNING id INTO NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER field_comments_insert
  INSTEAD OF INSERT ON public.field_comments_view
  FOR EACH ROW
  EXECUTE FUNCTION insert_field_comment();
