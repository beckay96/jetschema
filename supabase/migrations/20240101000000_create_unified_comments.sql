-- Create unified comments table for project collaboration
CREATE TABLE IF NOT EXISTS public.unified_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.database_projects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    object_type TEXT NOT NULL DEFAULT 'project',
    object_id TEXT NOT NULL,
    parent_object_id TEXT,
    is_task BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_unified_comments_project_id ON public.unified_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_unified_comments_author_id ON public.unified_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_unified_comments_object_type ON public.unified_comments(object_type);
CREATE INDEX IF NOT EXISTS idx_unified_comments_object_id ON public.unified_comments(object_id);
CREATE INDEX IF NOT EXISTS idx_unified_comments_is_task ON public.unified_comments(is_task);
CREATE INDEX IF NOT EXISTS idx_unified_comments_created_at ON public.unified_comments(created_at);

-- Enable Row Level Security
ALTER TABLE public.unified_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for unified_comments
-- Users can view comments for projects they have access to
CREATE POLICY "Users can view comments for accessible projects" ON public.unified_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.database_projects dp
            WHERE dp.id = unified_comments.project_id
            AND (
                dp.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.team_members tm
                    JOIN public.teams t ON tm.team_id = t.id
                    WHERE t.project_id = dp.id
                    AND tm.user_id = auth.uid()
                )
            )
        )
    );

-- Users can insert comments for projects they have access to
CREATE POLICY "Users can insert comments for accessible projects" ON public.unified_comments
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.database_projects dp
            WHERE dp.id = unified_comments.project_id
            AND (
                dp.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.team_members tm
                    JOIN public.teams t ON tm.team_id = t.id
                    WHERE t.project_id = dp.id
                    AND tm.user_id = auth.uid()
                )
            )
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON public.unified_comments
    FOR UPDATE USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.unified_comments
    FOR DELETE USING (auth.uid() = author_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_unified_comments_updated_at
    BEFORE UPDATE ON public.unified_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
