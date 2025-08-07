-- Create table for database enumerations
CREATE TABLE IF NOT EXISTS public.database_enumerations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.database_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    values TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_database_enumerations_project_id ON public.database_enumerations(project_id);
CREATE INDEX IF NOT EXISTS idx_database_enumerations_name ON public.database_enumerations(name);
CREATE INDEX IF NOT EXISTS idx_database_enumerations_created_by ON public.database_enumerations(created_by);

-- Enable RLS
ALTER TABLE public.database_enumerations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view enumerations in their team projects" ON public.database_enumerations
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create enumerations in their team projects" ON public.database_enumerations
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update enumerations in their team projects" ON public.database_enumerations
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete enumerations in their team projects" ON public.database_enumerations
    FOR DELETE USING (
        project_id IN (
            SELECT p.id FROM public.database_projects p
            JOIN public.team_members tm ON p.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.database_enumerations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;



--- run already
