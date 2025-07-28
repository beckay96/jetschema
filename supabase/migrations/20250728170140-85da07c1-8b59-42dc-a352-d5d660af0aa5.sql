-- Add read and completed status to field_comments
ALTER TABLE public.field_comments 
ADD COLUMN is_read boolean NOT NULL DEFAULT false,
ADD COLUMN is_completed boolean NOT NULL DEFAULT false;