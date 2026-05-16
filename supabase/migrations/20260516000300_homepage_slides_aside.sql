-- Optional right-rail copy for homepage hero slides (desktop column).

ALTER TABLE public.homepage_slides
  ADD COLUMN IF NOT EXISTS aside_label TEXT,
  ADD COLUMN IF NOT EXISTS aside_number TEXT,
  ADD COLUMN IF NOT EXISTS aside_text TEXT;
