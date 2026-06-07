-- Migration: add magic_tokens table for passwordless auth
CREATE TABLE IF NOT EXISTS public.magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS magic_tokens_email_idx ON public.magic_tokens(email);
CREATE INDEX IF NOT EXISTS magic_tokens_token_idx ON public.magic_tokens(token);

-- Add email column to users if not exists (for OAuth users)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
