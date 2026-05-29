-- scripts/006_advanced_reader.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'highlight_type') THEN
    CREATE TYPE public.highlight_type AS ENUM ('quote', 'editorial_comment', 'author_note');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'highlight_visibility') THEN
    CREATE TYPE public.highlight_visibility AS ENUM ('public', 'internal', 'private');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'highlight_status') THEN
    CREATE TYPE public.highlight_status AS ENUM ('pending', 'resolved', 'ignored');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  comment TEXT,
  type public.highlight_type NOT NULL DEFAULT 'quote',
  visibility public.highlight_visibility NOT NULL DEFAULT 'public',
  status public.highlight_status NOT NULL DEFAULT 'pending',
  range_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chapter_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, chapter_index, user_id)
);

CREATE TABLE IF NOT EXISTS public.book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlights_book ON public.highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_visibility ON public.highlights(visibility);
CREATE INDEX IF NOT EXISTS idx_chapter_ratings_book ON public.chapter_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_book ON public.book_reviews(book_id);

-- Add update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_highlights_updated_at ON public.highlights;
CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_reviews_updated_at ON public.book_reviews;
CREATE TRIGGER update_book_reviews_updated_at
  BEFORE UPDATE ON public.book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
