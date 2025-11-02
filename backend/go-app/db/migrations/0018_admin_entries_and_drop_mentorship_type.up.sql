CREATE TABLE manual_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    hours INT NOT NULL,
    cause TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT manual_entries_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,

    CONSTRAINT manual_entries_type_check 
        CHECK (type = ANY (ARRAY['client'::text, 'therapist'::text, 'mentor'::text]))
);

CREATE INDEX idx_manual_entries_user_id ON public.manual_entries(user_id);


ALTER TABLE public.contacts
DROP COLUMN mentorship_type;