-- Нечёткий поиск: триграммное расширение и GIN-индексы
-- Применить к Neon ПЕРЕД деплоем кода с word_similarity()

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_releases_title_trgm
  ON public.releases USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_characters_name_trgm
  ON public.characters USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_news_title_trgm
  ON public.news_posts USING gin (title gin_trgm_ops);
