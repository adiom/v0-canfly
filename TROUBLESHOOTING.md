# Решение проблем (Troubleshooting)

## Ошибка: "Error fetching books: TypeError: Load failed"

### Причины:
1. Переменные окружения Supabase не установлены
2. Supabase интеграция не подключена
3. Таблица books не создана в БД

### Решение:

#### Шаг 1: Проверьте интеграцию Supabase

Откройте Settings (сверху справа) → Integrations → Supabase

**Должно быть подключено:**
- Supabase проект

#### Шаг 2: Проверьте переменные окружения

Settings → Vars

**Должны быть установлены:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API ключ
- `SUPABASE_SERVICE_ROLE_KEY` - Service role ключ (опционально для некоторых операций)

Если переменных нет, Supabase интеграция их должна была добавить. Если нет:

1. Откройте [supabase.com](https://supabase.com)
2. Откройте ваш проект
3. Settings → API
4. Найдите:
   - Project URL → скопируйте в `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → скопируйте в `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Шаг 3: Создайте таблицу books

Если таблица `books` не существует:

1. Откройте Supabase console
2. SQL Editor
3. Выполните эту команду:

```sql
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'comic',
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

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);

-- Добавляем sample данные
INSERT INTO books (title, slug, type, description, cover_image, price, is_featured, display_order) VALUES
('The Cipher Chronicles: Genesis', 'cipher-chronicles-genesis', 'comic', 'Начало эпической саги о герое, который может управлять временем и пытается предотвратить апокалипсис.', 'https://images.unsplash.com/photo-1618835962148-cf2c217ea5c0?w=400&h=600&fit=crop', 599.99, true, 1),
('Shadows of Rebellion', 'shadows-of-rebellion', 'book', 'Романтизированный рассказ о восстании против тиранического режима и цене свободы.', 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&h=600&fit=crop', 799.99, true, 2),
('The Aether Codex', 'aether-codex', 'comic', 'Визуальный эпос о древней магии и её скрытых законах. Каждая страница полна загадок.', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=600&fit=crop', 699.99, true, 3),
('Digital Ghosts', 'digital-ghosts', 'book', 'Рассказ о жизни хакеров в тени сетей. Остросюжетный триллер о цене информации.', 'https://images.unsplash.com/photo-1612220945571-fedda77c3b39?w=400&h=600&fit=crop', 549.99, true, 4),
('Nocturne: The Eclipse Files', 'nocturne-eclipse-files', 'comic', 'Серия о тёмном прошлом и пути к искуплению. Красивое чёрно-белое искусство вызывает мурашки.', 'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=400&h=600&fit=crop', 649.99, true, 5)
ON CONFLICT DO NOTHING;
```

## Ошибка: "Cannot find module '@/lib/types'"

### Решение:
Убедитесь что файл `/lib/types.ts` существует. Если нет, создайте его с типами данных.

## Ошибка: "OPENAI_API_KEY not found"

### Решение:
1. Откройте Settings → Vars
2. Добавьте переменную `OPENAI_API_KEY`
3. Значение: ваш OpenAI API ключ (получите на [platform.openai.com](https://platform.openai.com/api-keys))

## Проект загружается очень долго

### Возможные причины:
1. Первый запрос к API (revalidate = 3600)
2. Медленное интернет соединение
3. Supabase проект на бесплатном плане (холодный старт)

### Решение:
- Просто дождитесь загрузки
- В продакшене используйте paid Supabase план

## Чат персонажей не работает

### Решение:
1. Проверьте что `OPENAI_API_KEY` установлен
2. Откройте браузер console (F12)
3. Проверьте есть ли ошибки при отправке сообщения
4. Убедитесь что у вас есть баланс на OpenAI аккаунте

## Посты персонажей не загружаются

### Решение:
1. Убедитесь что таблица `character_posts` создана
2. Проверьте что персонажи добавлены в БД
3. Если таблицы нет, выполните SQL:

```sql
CREATE TABLE IF NOT EXISTS character_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'thought',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_posts_character ON character_posts(character_id);
CREATE INDEX IF NOT EXISTS idx_character_posts_created ON character_posts(created_at DESC);

ALTER TABLE character_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Character posts are viewable by everyone" ON character_posts;
CREATE POLICY "Character posts are viewable by everyone" ON character_posts FOR SELECT USING (true);
```

## Нужна дополнительная помощь?

1. Проверьте файлы документации:
   - `README.md` - основная документация
   - `SETUP.md` - подробная инструкция
   - `FEATURES.md` - описание функций
   - `UPDATES.md` - список обновлений

2. Проверьте логи:
   - Откройте браузер console (F12 → Console)
   - Проверьте Network tab для запросов к API
   - Посмотрите логи сервера в v0 terminal

3. Убедитесь что все зависимости установлены:
   ```bash
   pnpm install
   ```

4. Перезагрузите сервер:
   ```bash
   Ctrl+C в terminal и снова pnpm dev
   ```
