-- Add a nullable batch_id column to manual_entries
ALTER TABLE public.manual_entries
ADD COLUMN batch_id UUID NULL;

-- Add an index for faster lookups by batch_id
CREATE INDEX idx_manual_entries_batch_id ON public.manual_entries(batch_id);