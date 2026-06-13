-- Add quality_tier column to editions table
-- Values: 'draft', 'standard', 'premium'
-- Default: 'standard' for backward compatibility

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'editions' AND column_name = 'quality_tier'
  ) THEN
    ALTER TABLE public.editions ADD COLUMN quality_tier TEXT NOT NULL DEFAULT 'standard';
  END IF;
END $$;

-- Add index for quality_tier queries
CREATE INDEX IF NOT EXISTS idx_editions_quality_tier ON public.editions(quality_tier);

-- Update existing book editions with web-draft slug to have quality_tier = 'draft'
UPDATE public.editions
SET quality_tier = 'draft'
WHERE format = 'book' AND slug LIKE 'web-draft%';

-- Update existing book editions with standard slugs (book, kniga, etc.) to have quality_tier = 'standard'
UPDATE public.editions
SET quality_tier = 'standard'
WHERE format = 'book' AND quality_tier = 'standard' AND slug NOT LIKE 'web-draft%' AND slug NOT LIKE 'premium%';

-- Update existing book editions with premium slugs to have quality_tier = 'premium'
UPDATE public.editions
SET quality_tier = 'premium'
WHERE format = 'book' AND slug LIKE 'premium%';