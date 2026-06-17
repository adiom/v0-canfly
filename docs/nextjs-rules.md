# Next.js Agent Rules — canfly

## ГЛАВНОЕ ПРАВИЛО

**Перед любой работой с Next.js — ЧИТАЙ ДОКУМЕНТАЦИЮ в `node_modules/next/dist/docs/`.**

Твои данные обучения устарели. Документация в `node_modules/next/dist/docs/` — источник истины.

---

## Как читать документацию

1. Определи тему (App Router, API Routes, Server Components, и т.д.)
2. Найди соответствующий файл в `node_modules/next/dist/docs/01-app/`
3. Прочитай перед написанием кода

Структура:
```
node_modules/next/dist/docs/
├── 01-app/
│   ├── 01-getting-started/
│   ├── 02-guides/
│   ├── 03-api-reference/
│   └── 04-glossary.md
├── 02-pages/
├── 03-architecture/
└── index.md
```

---

## Ключевые правила для canfly (Next.js 16 + App Router)

### Server Components vs Client Components

- **Server Components по умолчанию** — не добавляй `'use client'` без необходимости
- `'use client'` только для: интерактивность, хуки (useState, useEffect), browser APIs
- Server Components могут быть async — используй `async` напрямую

### Server Actions

- Определяются в `lib/actions/studio.ts` и `lib/actions/studio-characters.ts`
- Всегда начинай с `'use server'` в файле
- Валидируй входные данные через Zod (`lib/schemas/studio.ts`)
- Используй `requireStudioSession()` / `requireStudioAdminSession()` для авторизации

### API Routes

- Файлы: `app/api/*/route.ts`
- Экспортируй именованные функции: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Используй `NextRequest` / `NextResponse` из `next/server`
- Обёртка `apiHandler()` из `lib/api-handler.ts` доступна при необходимости

### Маршрутизация

- Динамические сегменты: `[slug]`, `[id]`
- Catch-all: `[...slug]`
- Optional catch-all: `[[...slug]]`
- Layouts: `layout.tsx` наследуются дочерними страницами
- Loading: `loading.tsx` для Suspense-фолбэков
- Error: `error.tsx` для error boundaries

### Рендеринг

- **Static (SSG)**: по умолчанию для статических страниц
- **Dynamic (SSR)**: используй `export const dynamic = 'force-dynamic'` или `cookies()`/`headers()`
- **Streaming**: обёрни в `<Suspense>` с `loading.tsx`
- **Parallel Routes**: `@slot` для параллельного рендеринга

### Метаданные

```typescript
// Статические
export const metadata = { title: '...', description: '...' }

// Динамические
export async function generateMetadata({ params }) {
  return { title: `... ${params.slug}` }
}
```

### Кэширование (Next.js 16)

- `fetch()` кэшируется по умолчанию — отключай через `{ cache: 'no-store' }` при необходимости
- `unstable_cache()` для кэширования результатов БД-запросов
- `revalidatePath()` / `revalidateTag()` для инвалидации кэша
- Не кэшируй данные корзины и сессий пользователя

### Middleware (proxy.ts в canfly)

- Файл называется `proxy.ts` (не `middleware.ts`)
- Экспортирует `proxy()` и `config`
- Matcher определяет защищённые маршруты

---

## Типичные ошибки

1. **Не читаешь docs перед кодом** — всегда проверяй `node_modules/next/dist/docs/`
2. **Добавляешь `'use client'` куда не надо** — сначала попробуй Server Component
3. **Кэшируешь данные пользователя** — используй `cache: 'no-store'`
4. **Забываешь `export const dynamic`** — для страниц依赖 от cookies/headers
5. **Используешь `useParams()` в Server Component** — useParams только в Client Components

---

## Порядок действий

1. Получил задачу → определи тип (страница, API, компонент, серверная логика)
2. Найди relevant doc в `node_modules/next/dist/docs/`
3. Прочитай doc
4. Напиши код следуя прочитанной документации
5. Проверь через `pnpm build` и `pnpm lint`
