-- 1) Add a standalone ISO‐DATE column (default to today)
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT now()::date;


-- 2) Backfill existing rows if you need custom dates:
--    (omit if DEFAULT is fine)
-- UPDATE entries SET date = created_at::date WHERE date IS NULL;

-- 3) Remove the now‐redundant hours column
ALTER TABLE entries
  DROP COLUMN IF EXISTS hours;
