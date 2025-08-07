-- Create table for storage buckets planning
CREATE TABLE IF NOT EXISTS public.storage_buckets_plan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.database_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    public BOOLEAN DEFAULT false,
    file_size_limit BIGINT, -- in bytes
    allowed_mime_types TEXT[] DEFAULT '{}',
    linked_tables TEXT[] DEFAULT '{}', -- table names that reference this bucket
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_storage_buckets_plan_project_id ON public.storage_buckets_plan(project_id);
CREATE INDEX IF NOT EXISTS idx_storage_buckets_plan_name ON public.storage_buckets_plan(name);
CREATE INDEX IF NOT EXISTS idx_storage_buckets_plan_created_by ON public.storage_buckets_plan(created_by);
CREATE INDEX IF NOT EXISTS idx_storage_buckets_plan_public ON public.storage_buckets_plan(public);

-- Enable RLS
ALTER TABLE public.storage_buckets_plan ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view storage buckets in their team projects" ON public.storage_buckets_plan
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create storage buckets in their team projects" ON public.storage_buckets_plan
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update storage buckets in their team projects" ON public.storage_buckets_plan
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete storage buckets in their team projects" ON public.storage_buckets_plan
    FOR DELETE USING (
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.storage_buckets_plan TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;



--- run already