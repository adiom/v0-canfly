-- === Новая система highlights для глав релизов ===

-- 1. Цитаты читателей
CREATE TABLE IF NOT EXISTS public.chapter_highlights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id       UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  text_content     TEXT NOT NULL,
  paragraph_index  INTEGER,
  context_before   TEXT,
  context_after    TEXT,

  note             TEXT,
  is_public        BOOLEAN NOT NULL DEFAULT false,
  likes_count      INTEGER NOT NULL DEFAULT 0,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_highlights_chapter ON public.chapter_highlights(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_highlights_user ON public.chapter_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_highlights_public ON public.chapter_highlights(chapter_id, is_public);

-- 2. Лайки на цитатах
CREATE TABLE IF NOT EXISTS public.chapter_highlight_likes (
  highlight_id  UUID NOT NULL REFERENCES public.chapter_highlights(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (highlight_id, user_id)
);

-- 3. Редакторские правки (только Studio, читателям не видны)
CREATE TABLE IF NOT EXISTS public.chapter_editorial_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id       UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  author_id        UUID NOT NULL REFERENCES public.users(id),

  text_content     TEXT NOT NULL,
  paragraph_index  INTEGER,
  context_before   TEXT,
  context_after    TEXT,

  note             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_editorial_notes_chapter ON public.chapter_editorial_notes(chapter_id, status);

-- 4. Удаляем старую таблицу
DROP TABLE IF EXISTS public.highlights CASCADE;
DROP TABLE IF EXISTS public.chapter_ratings CASCADE;
DROP TABLE IF EXISTS public.book_reviews CASCADE;
