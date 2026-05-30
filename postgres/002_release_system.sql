-- Release System: ENUMs + 12 tables
-- Depends on: public.characters, public.users (from schema.sql)

-- === ENUMs ===

DO $$
BEGIN
  CREATE TYPE public.release_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.edition_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.edition_format AS ENUM ('book', 'comic', 'audiobook', 'album', 'magazine');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.media_type AS ENUM ('trailer', 'podcast', 'review', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.collaborator_role AS ENUM ('owner', 'editor', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.chapter_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.release_character_role AS ENUM ('main', 'supporting', 'cameo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'spam');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- === TABLES ===

CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  genre TEXT,
  release_date DATE,
  isbn TEXT,
  authors JSONB NOT NULL DEFAULT '[]'::jsonb,
  annotation TEXT,
  editor_notes TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  status public.release_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  format public.edition_format NOT NULL DEFAULT 'book',
  platform TEXT,
  external_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  status public.edition_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  chapter_index INTEGER NOT NULL,
  status public.chapter_status NOT NULL DEFAULT 'draft',
  word_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.release_series (
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  phase_number INTEGER,
  PRIMARY KEY (release_id, series_id)
);

CREATE TABLE IF NOT EXISTS public.release_characters (
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role public.release_character_role NOT NULL DEFAULT 'supporting',
  PRIMARY KEY (release_id, character_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status public.comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.release_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  type public.media_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.release_collaborators (
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.collaborator_role NOT NULL DEFAULT 'viewer',
  PRIMARY KEY (release_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chapter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_releases_slug ON public.releases(slug);
CREATE INDEX IF NOT EXISTS idx_releases_status ON public.releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_release_date ON public.releases(release_date DESC);

CREATE INDEX IF NOT EXISTS idx_editions_release ON public.editions(release_id);
CREATE INDEX IF NOT EXISTS idx_editions_slug ON public.editions(slug);
CREATE INDEX IF NOT EXISTS idx_editions_status ON public.editions(status);

CREATE INDEX IF NOT EXISTS idx_chapters_edition ON public.chapters(edition_id);
CREATE INDEX IF NOT EXISTS idx_chapters_edition_index ON public.chapters(edition_id, chapter_index);

CREATE INDEX IF NOT EXISTS idx_series_slug ON public.series(slug);

CREATE INDEX IF NOT EXISTS idx_release_series_series ON public.release_series(series_id);

CREATE INDEX IF NOT EXISTS idx_release_characters_character ON public.release_characters(character_id);

CREATE INDEX IF NOT EXISTS idx_comments_release ON public.comments(release_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);

CREATE INDEX IF NOT EXISTS idx_release_media_release ON public.release_media(release_id);

CREATE INDEX IF NOT EXISTS idx_reading_progress_edition ON public.reading_progress(edition_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON public.reading_progress(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reading_progress_session ON public.reading_progress(session_id) WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_user_unique
  ON public.reading_progress(edition_id, chapter_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_session_unique
  ON public.reading_progress(edition_id, chapter_id, session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_release_collaborators_user ON public.release_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_chapter ON public.bookmarks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter ON public.chapter_versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_number ON public.chapter_versions(chapter_id, version_number DESC);

-- === TRIGGERS (reuse existing update_updated_at_column function) ===

DROP TRIGGER IF EXISTS update_releases_updated_at ON public.releases;
CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON public.releases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_series_updated_at ON public.series;
CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_editions_updated_at ON public.editions;
CREATE TRIGGER update_editions_updated_at
  BEFORE UPDATE ON public.editions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
