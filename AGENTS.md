# AGENTS.md — Инструкции для AI-агентов

Этот документ содержит контекст и правила для работы с проектом **canfly | культура твоего сознания**.

## Обзор проекта

**canfly** — литературная вселенная с веб-платформой для издательства комиксов, книг и аудиокниг.

### Технологический стек
- **Frontend**: Next.js 16 (App Router), React 19.2, TypeScript 5.7
- **Styling**: Tailwind CSS v4, shadcn/ui компоненты
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **AI**: OpenAI GPT-4 Mini для чата с персонажами
- **Deployment**: Vercel

### Ключевые зависимости
```json
{
  "next": "16.2.0",
  "react": "19.2.4",
  "typescript": "5.7.3",
  "@supabase/ssr": "^0.9.0",
  "ai": "^6.0.140",
  "tailwindcss": "^4.2.0"
}
```

## Архитектура

### Структура директорий
```
app/
├── api/              # API endpoints
│   ├── admin/        # Админ API
│   ├── books/        # Книги API
│   ├── characters/   # Персонажи + AI-чат
│   ├── orders/       # Заказы
│   └── homepage-slides/
├── admin/            # Админ-панель
├── books/            # Читалка книг
├── cart/             # Корзина
├── characters/       # Персонажи + граф
├── shop/             # Магазин
└── markdown/         # Markdown-редактор

components/
├── ui/               # shadcn/ui компоненты
├── character-chat.tsx
├── character-graph.tsx
├── character-posts-feed.tsx
└── home-hero-slider.tsx

lib/
├── supabase/         # Supabase клиенты
├── cart-context.tsx  # Context для корзины
├── types.ts          # TypeScript типы
└── utils.ts          # Утилиты
```

### База данных (Supabase)

**Таблицы:**
1. `books` — книги, комиксы, аудиокниги
2. `characters` — персонажи вселенной
3. `character_relationships` — связи между персонажами
4. `character_posts` — посты персонажей (соцсеть)
5. `orders` — заказы пользователей
6. `homepage_slides` — слайды главной страницы
7. `admins` — whitelist администраторов

**SQL миграции:** `supabase/migrations/`

## Правила разработки

### 1. Стиль кода

**TypeScript:**
- Строгая типизация (`strict: true`)
- Использовать интерфейсы из `lib/types.ts`
- Избегать `any`, использовать `unknown` при необходимости

**React:**
- Server Components по умолчанию
- Client Components только для интерактива (добавлять `'use client'`)
- Использовать `async/await` в Server Components

**Naming:**
- Компоненты: `PascalCase`
- Файлы компонентов: `kebab-case.tsx`
- Функции/переменные: `camelCase`
- Константы: `UPPER_SNAKE_CASE`

### 2. Стилизация

**Tailwind CSS:**
- Использовать утилитные классы
- Цветовая палитра проекта:
  - Фон: `#111210`, `#1b1c19`
  - Текст: `#f4efe5`, `#ded7cc`
  - Акцент: `#d52525` (красный)
  - Дополнительно: `#f6d6a8`, `#9db5c8`, `#d7c6ad`

**Компоненты:**
- Использовать shadcn/ui из `components/ui/`
- Кастомизировать через Tailwind классы
- Сохранять артхаусный стиль (тёмная тема, минимализм)

### 3. API Routes

**Структура:**
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Логика
  
  return NextResponse.json({ data })
}
```

**Правила:**
- Всегда использовать `createClient()` из `lib/supabase/server`
- Обрабатывать ошибки с понятными сообщениями
- Возвращать JSON с полями `data` или `error`
- Использовать правильные HTTP статусы

### 4. Supabase

**Клиенты:**
- Server: `lib/supabase/server.ts` — для API Routes и Server Components
- Client: `lib/supabase/client.ts` — для Client Components

**Запросы:**
```typescript
// Получение данных
const { data, error } = await supabase
  .from('books')
  .select('*')
  .eq('is_featured', true)

// Вставка
const { data, error } = await supabase
  .from('orders')
  .insert({ customer_name, items })
  .select()
  .single()
```

### 5. AI-чат с персонажами

**Endpoint:** `POST /api/characters/chat`

**Структура:**
```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Системный промпт для каждого персонажа
const systemPrompt = `Вы ${character.name}. ${character.full_description}...`

const result = streamText({
  model: openai('gpt-4o-mini'),
  system: systemPrompt,
  messages,
})
```

**Требования:**
- Переменная `OPENAI_API_KEY` в `.env.local`
- Уникальный промпт для каждого персонажа
- Streaming ответов через `ai` SDK

## Уникальные фичи проекта

### 1. Граф персонажей
- Компонент: `components/character-graph.tsx`
- Визуализация связей между персонажами
- Данные из `character_relationships`

### 2. Соцсеть персонажей
- Компонент: `components/character-posts-feed.tsx`
- Типы постов: `thought`, `announcement`, `question`
- Таблица: `character_posts`

### 3. Читалка книг
- Страница: `app/books/[slug]/page.tsx`
- Поле `preview_pages` в таблице `books` (JSON массив URL)
- Навигация между страницами

### 4. Админ-панель
- Защита: `middleware.ts` + `lib/admin-auth.ts`
- Пароль: `ADMIN_PASSWORD` из `.env.local`
- Управление: книги, персонажи, заказы, слайды

## Частые задачи

### Добавить новую страницу
```typescript
// app/new-page/page.tsx
export const metadata = {
  title: 'Название | canfly',
  description: 'Описание',
}

export default function NewPage() {
  return <main>...</main>
}
```

### Создать API endpoint
```typescript
// app/api/new-endpoint/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('table').select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
```

### Добавить компонент
```typescript
// components/new-component.tsx
'use client' // если нужна интерактивность

interface NewComponentProps {
  title: string
}

export function NewComponent({ title }: NewComponentProps) {
  return <div>{title}</div>
}
```

### Работа с БД
```sql
-- Добавить книгу
INSERT INTO books (title, slug, type, price, cover_image)
VALUES ('Название', 'slug', 'book', 59999, 'https://...');

-- Добавить персонажа
INSERT INTO characters (name, slug, avatar, bio)
VALUES ('Имя', 'slug', 'https://...', 'Описание');

-- Создать связь
INSERT INTO character_relationships (character_id, related_character_id, relationship_type)
VALUES (uuid1, uuid2, 'Союзник');
```

## Переменные окружения

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_PASSWORD=admin123
```

## Команды

```bash
# Разработка
pnpm dev

# Сборка
pnpm build

# Продакшн
pnpm start

# Линтинг
pnpm lint

# Структура БД
pnpm db:structure
```

## Важные замечания

### ❌ Чего НЕ делать
- Не удалять файлы без разрешения
- Не изменять структуру БД без миграций
- Не коммитить `.env.local`
- Не использовать `any` в TypeScript
- Не создавать Server Components с интерактивностью

### ✅ Что делать
- Проверять типы перед коммитом
- Использовать существующие компоненты из `components/ui/`
- Следовать цветовой палитре проекта
- Добавлять комментарии к сложной логике
- Тестировать изменения локально

## Дизайн-система

### Типография
- Заголовки: `font-black uppercase`
- Текст: `leading-7` или `leading-8`
- Мелкий текст: `text-xs uppercase tracking-[0.18em]`

### Spacing
- Секции: `py-12 md:py-16`
- Контейнеры: `max-w-7xl mx-auto px-4 md:px-8`
- Карточки: `p-4` или `p-6`

### Borders
- Тонкие: `border-[#f4efe5]/10`
- Hover: `hover:border-[#f6d6a8]/45`

### Buttons
```tsx
<button className="h-12 px-5 bg-[#d52525] text-white font-black uppercase text-sm">
  Кнопка
</button>
```

## Контакты и ресурсы

- **Документация Next.js**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

## Changelog

При внесении изменений обновляйте `UPDATES.md` с описанием:
- Что изменено
- Зачем
- Как использовать

---

**Версия документа:** 1.0  
**Последнее обновление:** 16 мая 2026
