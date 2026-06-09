<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->


# AGENTS.md — Инструкции для AI-агентов

Этот документ содержит контекст и правила для работы с проектом **canfly | культура твоего сознания**.

## Обзор проекта

**canfly** — литературная вселенная с веб-платформой для издательства комиксов, книг и аудиокниг.

### Технологический стек
- **Frontend**: Next.js 16.2.7 (App Router), React 19.2.7, TypeScript 5.7.3
- **Styling**: Tailwind CSS v4, shadcn/ui (new-york style)
- **Backend**: Next.js API Routes + Server Actions, Neon/Vercel Postgres (`pg` Pool, без ORM)
- **Auth**: next-auth v5 beta (magic link + Yandex/Google OAuth)
- **AI**: Vercel AI SDK v6, GPT-4o-mini через AI Gateway
- **Storage**: Vercel Blob (images, audio)
- **Deployment**: Vercel, Turbopack в dev-режиме

### Ключевые зависимости
```json
{
  "next": "16.2.7",
  "react": "19.2.7",
  "next-auth": "5.0.0-beta.25",
  "typescript": "5.7.3",
  "pg": "^8.21.0",
  "ai": "^6.0.197",
  "tailwindcss": "^4.2.0",
  "@vercel/blob": "latest",
  "zod": "^3",
  "recharts": "^2",
  "@tiptap/react": "^3"
}
```

## Архитектура

### Структура директорий
```
app/
├── (auth)/           # next-auth конфиг, server actions для авторизации
│   ├── auth.config.ts  # NextAuth config (providers, callbacks, JWT)
│   ├── auth.ts         # NextAuth singleton
│   └── actions.ts      # createMagicLink, loginWithMagicLink
├── api/
│   ├── admin/          # Админ API (требует роль admin)
│   ├── books/          # Книги
│   ├── characters/     # Персонажи + AI-чат + дружба + стена
│   ├── chapter-highlights/  # Хайлайты
│   ├── chapter-editorial-notes/
│   ├── chapters/       # Rate endpoint
│   ├── magic/verify/   # Magic link redemption
│   ├── orders/
│   ├── search/
│   ├── studio/upload/  # Vercel Blob upload для Studio
│   └── user/session/
├── admin/            # Старая панель (только admin роль)
├── books/            # Читалка книг (старая система)
├── cart/
├── characters/       # Публичные профили + чат
├── login/
├── markdown/         # Markdown-редактор
├── news/
├── profile/          # Профиль читателя (требует авторизации)
├── release/          # Новая система релизов (основная)
├── search/
├── shop/
└── studio/           # Studio для авторов/редакторов/админов

components/
├── ui/               # shadcn/ui компоненты
├── studio/           # Studio-специфичные компоненты
├── search/           # Search dialog и результаты
├── release-book-reader.tsx   # Основной ридер (Release система)
├── release-comic-reader.tsx
├── release-audio-player.tsx
├── book-reader.tsx           # Ридер старой системы
├── comic-reader.tsx
├── character-chat.tsx
├── character-posts-feed.tsx
├── character-profile-tabs.tsx
├── character-profile-header.tsx
├── character-friend-button.tsx
├── character-wall.tsx
├── home-hero-slider.tsx
├── magic-link-form.tsx
├── markdown-editor.tsx
├── markdown-renderer.tsx
└── ...

lib/
├── db.ts                   # pg Pool, dbQuery/dbQueryOne
├── types.ts                # Основные TypeScript-типы
├── releases-types.ts       # Типы системы релизов
├── utils.ts                # cn() утилита
├── api-handler.ts          # apiHandler() враппер для API routes
├── sanitize.ts             # DOMPurify: sanitizeHtml/sanitizeChapterHtml
├── slug-utils.ts           # generateSlug() (кириллица → латиница)
├── cart-context.tsx        # React Context для корзины (localStorage)
├── homepage-slide-store.ts # Postgres + JSON fallback для слайдов
├── seo/schema.ts           # JSON-LD генераторы (Organization, Book, Breadcrumb)
├── schemas/                # Zod-схемы
├── actions/
│   ├── studio.ts           # Server actions для релизов/глав/серий
│   └── studio-characters.ts # Server actions для персонажей/постов
└── server/                 # Серверные репозитории
    ├── books.ts
    ├── characters.ts
    ├── chapters.ts
    ├── chapter-highlights.ts
    ├── character-posts.ts
    ├── character-wall.ts
    ├── editions.ts
    ├── releases.ts
    ├── series.ts
    ├── session.ts          # getCurrentUser(), getUserRoles()
    ├── studio-auth.ts      # requireStudioSession(), requireStudioAdminSession()
    └── users.ts            # Пользователи, роли, пароли (PBKDF2)

proxy.ts                    # ⚠️ Middleware (НЕ middleware.ts — файл называется proxy.ts)
postgres/
├── schema.sql              # Основная идемпотентная схема
├── 002_release_system.sql
├── 003_add_audiorelease.sql
├── 004_release_design.sql
└── highlights-migration.sql
```

### База данных (Neon/Vercel Postgres)

**Основные таблицы (schema.sql):**
1. `books` — книги, комиксы, аудиокниги (старая система)
2. `characters` — персонажи с AI-полями (reply_mode, personality_traits, abilities JSONB)
3. `character_relationships` — связи между персонажами
4. `book_characters` — связи книга ↔ персонаж
5. `users` — зарегистрированные пользователи
6. `user_roles` — роли пользователей (reader/author/editor/admin)
7. `character_friendships` — дружба пользователей с персонажами
8. `character_conversations` — диалоги с AI-персонажами
9. `character_messages` — сообщения в диалогах
10. `character_user_memories` — память AI-персонажей о пользователях
11. `orders` — заказы
12. `admins` — whitelist администраторов (legacy)
13. `character_posts` — посты персонажей
14. `homepage_slides` — слайды главной
15. `magic_tokens` — токены для passwordless-авторизации

**Таблицы системы релизов (002_release_system.sql):**
`releases`, `series`, `editions`, `chapters`, `chapter_versions`, `release_series`, `release_characters`, `comments`, `release_media`, `reading_progress`, `release_collaborators`, `bookmarks`

**Хайлайты (highlights-migration.sql):**
`chapter_highlights`, `chapter_highlight_likes`, `chapter_editorial_notes`

**SQL schema:** `postgres/schema.sql` (основная), остальные в `postgres/`

### Два параллельных пространства

Проект содержит два читательских и два авторских пространства:

| Старая система | Новая система |
|---|---|
| `/books/[slug]` — ридер | `/release/[slug]` — ридер |
| `book-reader.tsx` | `release-book-reader.tsx` |
| `app/api/admin/` + `/admin/` | `studio/` + server actions |
| Таблицы `books`, `characters` | Таблицы `releases`, `editions`, `chapters` |

Новые функции добавлять в Release-систему, не в старую.

## Авторизация

### Middleware
Файл называется **`proxy.ts`** (не `middleware.ts`). Экспортирует `proxy()` и `config`. Защищает:
- `/profile/*` — требует JWT-токен (любой авторизованный)
- `/admin/*` (кроме `/admin/login`) — требует JWT с ролью `admin`
- `/login` — авторизованных редиректит на `/`

### next-auth v5
- Конфиг: `app/(auth)/auth.config.ts`
- Синглтон: `app/(auth)/auth.ts`
- Провайдеры: Credentials (magic link), Yandex (опционально), Google (опционально)
- Стратегия: JWT. Роли загружаются из `user_roles` при логине, кэшируются в JWT.

### Роли
```typescript
type UserRole = 'reader' | 'author' | 'editor' | 'admin'
```
- `reader` — по умолчанию при регистрации
- `author` — доступ в Studio
- `editor` — доступ в Studio
- `admin` — доступ в Studio + Admin panel

### Защита Studio routes
```typescript
import { requireStudioSession, requireStudioAdminSession } from '@/lib/server/studio-auth'

// В server actions или page.tsx:
const session = await requireStudioSession()      // author | editor | admin
const session = await requireStudioAdminSession() // только admin
```

### Magic link
```typescript
import { createMagicLink } from '@/app/(auth)/actions'
// Генерирует 8-символьный hex-токен, хранит в magic_tokens
// ⚠️ EMAIL НЕ ОТПРАВЛЯЕТСЯ — интеграция с Resend/Nodemailer не реализована
// В dev-режиме токен логируется в консоль и возвращается в ответе
```

## Правила разработки

### 1. Стиль кода

**TypeScript:**
- Строгая типизация (`strict: true`)
- Основные интерфейсы в `lib/types.ts`, типы Release-системы в `lib/releases-types.ts`
- Избегать `any`, использовать `unknown` при необходимости

**React:**
- Server Components по умолчанию
- Client Components только для интерактива (`'use client'`)
- Server Actions в `lib/actions/studio.ts` и `lib/actions/studio-characters.ts`

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

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  const data = await dbQuery('SELECT * FROM books')
  return NextResponse.json({ data })
}
```

**Правила:**
- Всегда использовать `lib/db.ts` или `lib/server/*` для доступа к БД
- Обрабатывать ошибки с понятными сообщениями
- Возвращать JSON с полями `data` или `error`
- Использовать `apiHandler()` из `lib/api-handler.ts` для обёртки при необходимости

### 4. Server Actions (Studio)

```typescript
// lib/actions/studio.ts или studio-characters.ts
'use server'

import { requireStudioSession } from '@/lib/server/studio-auth'

export async function myAction(data: MyData) {
  const session = await requireStudioSession()
  // логика
}
```

### 5. Postgres

```typescript
import { dbQuery, dbQueryOne } from '@/lib/db'

// Получение массива
const rows = await dbQuery<Book>(
  'SELECT * FROM books WHERE is_featured = true ORDER BY display_order ASC'
)

// Получение одной записи
const row = await dbQueryOne<Order>(
  'INSERT INTO orders (customer_name, items, total) VALUES ($1, $2::jsonb, $3) RETURNING *',
  [name, JSON.stringify(items), total]
)
```

### 6. Загрузка файлов (Vercel Blob)

```typescript
// POST /api/admin/upload или /api/studio/upload
import { put } from '@vercel/blob'

const blob = await put(filename, file, { access: 'public' })
return NextResponse.json({ url: blob.url })
```

### 7. AI-чат с персонажами

**Endpoint:** `POST /api/characters/chat`

```typescript
import { streamText } from 'ai'

const result = streamText({
  model: 'openai:gpt-4o-mini', // через Vercel AI Gateway
  system: systemPrompt,
  messages,
})
return result.toDataStreamResponse()
```

**Требования:**
- `OPENAI_API_KEY` в `.env.local`
- Системные промпты захардкожены для каждого персонажа в `app/api/characters/chat/route.ts`
- Streaming через Vercel AI SDK v6

## Уникальные фичи проекта

### 1. Система релизов (основная, новая)
- Читалка: `components/release-book-reader.tsx` (716 строк) — хайлайты, DOM-обёртка, прогресс
- Комикс-ридер: `components/release-comic-reader.tsx`
- Аудиоплеер: `components/release-audio-player.tsx`
- Маршруты: `/release/[slug]/[editionSlug]/[chapterIndex]`
- Server actions: `lib/actions/studio.ts`

### 2. Studio для авторов
- Маршрут: `/studio/`
- Доступен для ролей: `author`, `editor`, `admin`
- Tiptap-редактор: `components/studio/telegraph-editor.tsx`
- Управление: релизами, изданиями, главами, сериями, персонажами, постами

### 3. Соцсеть персонажей
- Посты: `components/character-posts-feed.tsx`, таблица `character_posts`
- Стена: `components/character-wall.tsx`, таблица `character_wall_posts`
- Дружба: `components/character-friend-button.tsx`, таблица `character_friendships`
- Типы постов: `thought`, `announcement`, `question`

### 4. Хайлайты (Release-ридер)
- DOM-based: TreeWalker для параграфов, `wrapHighlight()` для рендера
- API: `/api/chapter-highlights/`, `/api/chapter-editorial-notes/`
- Серверные функции: `lib/server/chapter-highlights.ts`
- Шаринг: `/release/[slug]/highlight/[id]`

### 5. Старая читалка книг
- Страница: `app/books/[slug]/page.tsx`
- Компонент: `components/book-reader.tsx`
- Поле `preview_pages` в таблице `books` (JSON массив URL)

### 6. Поиск
- Dialog: `components/search/search-dialog.tsx` (Cmd+K)
- Страница: `app/search/`
- API: `/api/search/` (autocomplete), `lib/server/search.ts` (ILIKE по books/characters/news)

### 7. Героический слайдер
- Компонент: `components/home-hero-slider.tsx`
- 5 тем: `atelier`, `night-city`, `pvz`, `volga`, `dreams`
- Авторотация 8.5с, Embla Carousel

## Известные баги (не трогать без фикса)

1. **Broken logout** — `app/admin/slider/page.tsx:61` вызывает `fetch('/api/admin/logout')`, этого роута не существует.
2. **Email не отправляется** — `app/(auth)/actions.ts:84` содержит TODO. Magic link только в dev-консоли.
3. **Hardcoded service key** — `scripts/import_books_fix.mjs` и `scripts/migrate-supabase-to-local.mjs` содержат Supabase service role JWT в исходнике. Это legacy-скрипты, не используются в production.

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
import { dbQuery } from '@/lib/db'

export async function GET() {
  const data = await dbQuery('SELECT * FROM table_name')
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
-- Добавить релиз
INSERT INTO releases (title, slug, author_user_id, status)
VALUES ('Название', 'slug', 'user-uuid', 'draft');

-- Добавить персонажа
INSERT INTO characters (name, slug, avatar, bio)
VALUES ('Имя', 'slug', 'https://...', 'Описание');

-- Создать связь
INSERT INTO character_relationships (character_id, related_character_id, relationship_type)
VALUES (uuid1, uuid2, 'Союзник');
```

## Переменные окружения

```env
# Postgres
DATABASE_URL=postgres://user:password@host/db?sslmode=require

# next-auth v5
AUTH_SECRET=xxx
AUTH_YANDEX_ID=xxx
AUTH_YANDEX_SECRET=xxx
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx

# OpenAI (через AI Gateway)
OPENAI_API_KEY=sk-xxx

# Vercel Blob
BLOB_READ_WRITE_TOKEN=xxx

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Убрано из .env**: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` — авторизация теперь через next-auth.

## Команды

```bash
# Разработка (Turbopack)
pnpm dev

# Сборка
pnpm build

# Продакшн
pnpm start

# Линтинг
pnpm lint

# Структура БД
pnpm db:structure

# E2E тесты (см. раздел ниже)
pnpm test:smoke
pnpm test:admin
pnpm test:studio
pnpm test:e2e

### Структура
```
e2e/
├── smoke.spec.ts          # Публичные маршруты (без авторизации) + профиль персонажа
├── admin.spec.ts          # Панель админа /admin/* (требует admin роль)
├── studio.spec.ts         # Studio /studio/* (требует author/editor/admin роль)
├── setup/
│   ├── global-setup.ts    # Создаёт тестового admin пользователя в БД
│   ├── global-teardown.ts # Удаляет тестового пользователя после тестов
│   ├── credentials.ts     # Типы для загрузки credentials из .test-credentials.json
│   └── login-helper.ts    # loginViaMagicLink() — логин через UI браузера
└── .test-credentials.json # (autogenerated) Credentials тестового пользователя
```

### Как работает логин в тестах
Тесты используют magic link flow прямо в браузере (через Playwright UI-автоматизацию):
1. Открыть `/login`
2. Ввести email тестового пользователя
3. В dev-режиме код показывается на странице — Playwright забирает его из DOM
4. Нажать «Ввести код», ввести код, нажать «Войти по коду»
5. Дождаться редиректа на `/profile` — сессия установлена

Этот процесс реализован в `e2e/setup/login-helper.ts`.

### Тестовый пользователь
- Создаётся в `global-setup.ts` через прямой INSERT в БД
- Email: `studio-test-admin@canfly.test` (константа `TEST_ADMIN_EMAIL` в global-setup.ts:6)
- Логин: `studio_test_admin`
- Роль: `admin` (даёт доступ и в admin, и в studio)
- Пароль **не нужен** — magic link не требует пароля
- После тестов удаляется через `global-teardown.ts`

Перед запуском тестов проверь что в `.env.local` есть `DATABASE_URL`.

### Команды
```bash
# Smoke-тесты (публичные маршруты + профиль персонажа)
pnpm test:smoke

# Admin-тесты (требуют admin роль)
pnpm test:admin

# Studio-тесты (требуют author/editor/admin роль)
pnpm test:studio

# Все e2e вместе
pnpm test:e2e
```

## Важные замечания

### ❌ Чего НЕ делать
- Не упоминать `middleware.ts` — файл называется `proxy.ts`
- Не использовать `lib/admin-auth.ts` — не существует (удалён)
- Не использовать `components/character-graph.tsx` — не существует (удалён)
- Не добавлять новые фичи в старую систему `/books/` — использовать Release-систему
- Не удалять файлы без разрешения
- Не изменять структуру БД без SQL-миграции в `postgres/`
- Не коммитить `.env.local`
- Не использовать `any` в TypeScript
- Не создавать Server Components с интерактивностью без `'use client'`
- Не добавлять `console.log` в production-код

### ✅ Что делать
- Проверять типы перед коммитом (`pnpm build`)
- Использовать `components/ui/` для базовых UI-элементов
- Следовать цветовой палитре проекта
- Для новых серверных функций — добавлять в `lib/server/`
- Тестировать изменения локально
- Обновлять `UPDATES.md` при значимых изменениях

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
- **Neon Docs**: https://neon.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **next-auth v5**: https://authjs.dev

## Changelog

При внесении изменений обновляйте `UPDATES.md` с описанием:
- Что изменено
- Зачем
- Как использовать

---

ВСЕГДА ОТВЕЧАЙ НА РУССКОМ И ПИШИ ЛАКОНИЧНО!
