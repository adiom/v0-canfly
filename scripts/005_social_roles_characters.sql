DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('reader', 'author', 'editor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.character_reply_mode AS ENUM ('ai_auto', 'manual', 'hybrid', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.character_friendship_status AS ENUM ('pending', 'accepted', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.character_message_role AS ENUM ('user', 'character', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.book_character_role AS ENUM ('main', 'supporting', 'cameo', 'mentioned');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS speaking_style TEXT,
  ADD COLUMN IF NOT EXISTS personality TEXT,
  ADD COLUMN IF NOT EXISTS boundaries TEXT,
  ADD COLUMN IF NOT EXISTS knowledge_scope TEXT,
  ADD COLUMN IF NOT EXISTS spoiler_policy TEXT,
  ADD COLUMN IF NOT EXISTS reply_mode public.character_reply_mode NOT NULL DEFAULT 'ai_auto',
  ADD COLUMN IF NOT EXISTS can_receive_messages BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.book_characters
  ADD COLUMN IF NOT EXISTS role public.book_character_role NOT NULL DEFAULT 'supporting',
  ADD COLUMN IF NOT EXISTS importance_score INTEGER NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  login TEXT UNIQUE,
  password_hash TEXT,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS login TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'reader',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.character_friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  status public.character_friendship_status NOT NULL DEFAULT 'accepted',
  intimacy_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

CREATE TABLE IF NOT EXISTS public.character_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

CREATE TABLE IF NOT EXISTS public.character_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.character_conversations(id) ON DELETE CASCADE,
  role public.character_message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.character_user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  summary TEXT,
  facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_character_friendships_user ON public.character_friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_character_friendships_character ON public.character_friendships(character_id);
CREATE INDEX IF NOT EXISTS idx_character_conversations_user ON public.character_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_character_messages_conversation_created
  ON public.character_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_book_characters_character_role
  ON public.book_characters(character_id, role, importance_score DESC);

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_friendships_updated_at ON public.character_friendships;
CREATE TRIGGER update_character_friendships_updated_at
  BEFORE UPDATE ON public.character_friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_conversations_updated_at ON public.character_conversations;
CREATE TRIGGER update_character_conversations_updated_at
  BEFORE UPDATE ON public.character_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
