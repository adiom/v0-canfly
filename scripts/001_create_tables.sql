-- Canfly Database Schema
-- Таблицы для издательства комиксов и книг

-- Enum для типов книг
CREATE TYPE book_type AS ENUM ('comic', 'book', 'audiobook');

-- Enum для статусов заказов
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'completed', 'cancelled');

-- Enum для тем hero-слайдов главной
CREATE TYPE homepage_slide_theme AS ENUM ('atelier', 'night-city', 'pvz', 'volga', 'dreams');

-- Таблица книг/комиксов
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type book_type NOT NULL DEFAULT 'comic',
  description TEXT,
  cover_image TEXT,
  preview_pages JSONB DEFAULT '[]'::jsonb,
  external_links JSONB DEFAULT '{}'::jsonb,
  price NUMERIC(10,2),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица персонажей
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  full_description TEXT,
  abilities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связи между персонажами
CREATE TABLE IF NOT EXISTS character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  related_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, related_character_id)
);

-- Связь книг и персонажей (many-to-many)
CREATE TABLE IF NOT EXISTS book_characters (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, character_id)
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status order_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hero-слайды главной страницы
CREATE TABLE IF NOT EXISTS homepage_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT,
  background_image TEXT,
  mobile_image TEXT,
  primary_cta_label TEXT,
  primary_cta_href TEXT,
  secondary_cta_label TEXT,
  secondary_cta_href TEXT,
  aside_label TEXT,
  aside_number TEXT,
  aside_text TEXT,
  theme homepage_slide_theme NOT NULL DEFAULT 'atelier',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица админов (email whitelist)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_characters_slug ON characters(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_slides_active_order ON homepage_slides(is_active, display_order);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homepage_slides_updated_at
  BEFORE UPDATE ON homepage_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS политики
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_slides ENABLE ROW LEVEL SECURITY;

-- Публичное чтение для книг и персонажей
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Characters are viewable by everyone" ON characters FOR SELECT USING (true);
CREATE POLICY "Character relationships are viewable by everyone" ON character_relationships FOR SELECT USING (true);
CREATE POLICY "Book characters are viewable by everyone" ON book_characters FOR SELECT USING (true);
CREATE POLICY "Homepage slides are viewable by everyone" ON homepage_slides FOR SELECT USING (true);

-- Заказы может создавать любой (анонимная покупка)
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);

-- Админы могут всё (через service role в админке)
-- Для операций записи будем использовать service role key
