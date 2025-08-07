-- Create table for tracking comment read status
CREATE TABLE IF NOT EXISTS public.comment_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.unified_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_read_status_comment_id ON public.comment_read_status(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_read_status_user_id ON public.comment_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_read_status_read_at ON public.comment_read_status(read_at);

-- Enable RLS
ALTER TABLE public.comment_read_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own read status" ON public.comment_read_status
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own read status" ON public.comment_read_status
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own read status" ON public.comment_read_status
    FOR UPDATE USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.comment_read_status TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;



--- run already