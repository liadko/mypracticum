CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT UNIQUE NOT NULL,
  name TEXT,
  signature BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profession TEXT NOT NULL CHECK (profession IN ('Psychologist','SocialWorker','Counselor')),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE external_therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profession TEXT NOT NULL CHECK (profession IN ('Psychologist','SocialWorker','Counselor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  mentor_id UUID REFERENCES mentors(id),
  external_therapist_id UUID REFERENCES external_therapists(id),
  type TEXT NOT NULL CHECK (type IN ('client','mentor','personal')),
  hours NUMERIC NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entries_one_assignment CHECK (
    (client_id IS NOT NULL)::int +
    (mentor_id IS NOT NULL)::int +
    (external_therapist_id IS NOT NULL)::int = 1
  )
);