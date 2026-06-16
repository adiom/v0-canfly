ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_blob_path TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS audio_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS audio_content_type TEXT,
  ADD COLUMN IF NOT EXISTS audio_file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS audio_uploaded_at TIMESTAMPTZ;
