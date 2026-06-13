-- 006: Passport + Cities (character_type)
-- Idempotent migration

-- Enum: character_type
DO $$ BEGIN
  CREATE TYPE public.character_type AS ENUM ('person', 'city');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- New columns on characters
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS character_type public.character_type NOT NULL DEFAULT 'person',
  ADD COLUMN IF NOT EXISTS passport TEXT,
  ADD COLUMN IF NOT EXISTS map_image_url TEXT;

-- Index on character_type for filtering
CREATE INDEX IF NOT EXISTS idx_characters_type ON public.characters(character_type);

-- Linking table: release_cities
-- Similar to release_characters but for cities as locations in releases
CREATE TABLE IF NOT EXISTS public.release_cities (
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'location',
  importance_score INT NOT NULL DEFAULT 0,
  PRIMARY KEY (release_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_release_cities_release ON public.release_cities(release_id);
CREATE INDEX IF NOT EXISTS idx_release_cities_character ON public.release_cities(character_id);
