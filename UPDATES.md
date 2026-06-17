# Обновления

---

## v6.5 — Слова песни + умный CTA для аудиорелизов (17 июня 2026)

### Что изменено

**1. Синхронизированные слова песни (Lyrics)**
- `lib/utils/lyrics.ts` — парсер LRC-формата (`[mm:ss.ms] текст`), сериализация LRC, `findActiveLine()` для подсветки по времени
- `lib/releases-types.ts` — типы `LyricLine`, `ChapterLyrics`, хелпер `extractLyrics()` для чтения из `audio_metadata`
- `lib/schemas/studio.ts` — zod-схемы `lyricLineSchema`, `lyricsSchema` для валидации
- `components/studio/audio-chapter-editor.tsx` — три режима:
  - **Ввод** — textarea с LRC-парсингом, автоопределение формата (synced/plain)
  - **Синхронизация** — ручная простановка таймкодов под играющий превью-аудио, кнопки «Поставить метку», «← Назад», «След. →»
  - **Превью** — тёмный плеер с подсветкой активной строки и перемоткой по клику
- `components/release-audio-player.tsx` — кнопка «Слова» в хедере, боковая панель с подсветкой активной строки (synced) или читаемым текстом (plain), автоскролл, клик по строке → перемотка
- Хранение: `audio_metadata.lyrics` в JSONB (без миграции БД)

**2. Навигация аудиоплеер → страница релиза**
- `components/release-audio-player.tsx` — pill-кнопка `← О релизе` в header, accent border, ведёт на `/release/${release.slug}`

**3. Format-aware hero CTA на странице релиза**
- `components/release-page.tsx` — CTA зависит от primary edition:
  - `audiorelease` → «Слушать релиз» + Disc3
  - `album` → «Слушать альбом» + Music2
  - `audiobook` → «Слушать аудиокнигу» + Headphones
  - `book` → «Читать» + BookOpen (как было)
  - `comic/magazine` → «Смотреть» / «Читать выпуск»
- `Одним файлом` показывается только для non-audio primary
- Alternate CTA: если primary = audio, но есть book → кнопка «Читать»; если primary = book, но есть audio → кнопка «Слушать»

**4. Smart meta chips**
- Audio primary: «N треков» + длительность
- Book primary: «N глав» + слов + время чтения
- `app/release/[slug]/page.tsx` — `meta.durationSeconds` суммарная длительность треков

**5. Багфикс: кнопка «Поставить метку» работала один раз**
- `stampCurrentLine()` проверял `lyrics.format !== 'plain'` — после первой метки блокировался. Убрано условие, теперь можно ставить/переставлять метки на любых строках

**6. Квадратная обложка для аудио**
- `components/release-page.tsx` — если primary edition = audiorelease/album/audiobook → `aspect-square rounded-xl`, иначе `aspect-[2/3] rounded-sm`

### Проверка
- `pnpm build` — успешно
- `pnpm lint` — 0 errors, pre-existing warnings only

---

## v6.4 — Lint cleanup + audiorelease zod-fix (16 июня 2026)

### Что изменено

**1. Zod-баг: создание Аудиорелиза заблокировано**
- `lib/schemas/studio.ts`: `editionFormatSchema` был без `'audiorelease'` → `createEditionAction` падал с «Invalid enum value» при создании издания формата Аудиорелиз. Добавлено значение (соответствует `lib/releases-types.ts` и `003_add_audiorelease.sql`).

**2. Lint-ошибки: 14 → 0 (Next 16 React Compiler)**
- `app/global-error.tsx`: 2× `<a href="/">` → `<Link>` (`@next/next/no-html-link-for-pages`)
- `components/highlight-artifact.tsx`: `useRef(Math.random())` → `useState` lazy-init (устранены impure-function и access-ref-in-render); reset-эффекты помечены `eslint-disable react-hooks/set-state-in-effect` с обоснованием
- `components/studio/editorial-notes-panel.tsx`: `useMemo`+ref подход → state-based с `hasLoaded` boolean (убран access-ref-in-render); data-loading эффекты помечены
- `components/studio/editorial-notes-overlay.tsx`, `chapter-editor-page.tsx` (`editorRef.current` в render → callback-ref + state), `character-friend-button.tsx`, `release-book-reader.tsx` — setState-in-effect помечены как валидный паттерн (data-loading / reset / DOM-layout-sync)

### Стратегия
React Compiler-правило `react-hooks/set-state-in-effect` стало `error` в Next 16. Для валидных use-case'ов (data-fetch на mount, reset при смене props, чтение DOM-layout) применён `eslint-disable` с комментарием-обоснованием вместо поломки data-flow. Глубокий рефакторинг (derived state, key-remount) оставлен на будущее — текущие эффекты семантически корректны.

### Проверка
- `pnpm exec tsc --noEmit` — 0 ошибок
- `pnpm lint` — **0 errors** (66 warnings, не в scope)
- `pnpm build` — успешно

---

## v6.3 — Security & Quality Pass (15 июня 2026)

### Что изменено

**1. IDOR-фикс — проверка владения в Studio (P0)**
- Добавлены `requireReleaseOwnership`, `requireEditionOwnership`, `requireChapterOwnership` в `lib/server/studio-auth.ts`
- Все mutate-actions в `lib/actions/studio.ts` теперь проверяют ownership через `release_collaborators` (role='owner') или admin
- Ранее любой автор мог мутировать чужой релиз/главу по UUID

**2. Устранена утечка AUTH_SECRET в логи**
- `proxy.ts` больше не выводит первые символы `AUTH_SECRET` при каждом запросе к `/profile`

**3. Баги ридера (release-book-reader.tsx)**
- `hl.user_id === hl.user_id` (тавтология) → `hl.user_id === currentUserId`
- `${hl.user_id}25` (UUID как hex-цвет) → `accent_for_hl(hl)`
- `revalidatePath('/release/${id}')` → `revalidatePath('/release/${release.slug}')` (UUID не инвалидировал кэш)

**4. Корректность данных**
- `setReleaseCharacters` / `setReleaseSeries` обёрнуты в транзакции (`withTransaction` в `lib/db.ts`) — устранена race condition
- `JSON.parse(authors)` обёрнут в `parseJsonArray` с try/catch и fallback на `[]`
- Реализовано сохранение прогресса чтения: `lib/server/reading-progress.ts`, `POST /api/reading-progress`, debounce 1.5с в ридере

**5. Zod-валидация Studio-actions**
- Новые схемы в `lib/schemas/studio.ts`: release, edition, chapter, series с enum-проверкой против postgres-типов
- Все create/update actions в `lib/actions/studio.ts` валидируют ввод через `validateForm()`

**6. Рефакторинг**
- `wrapHighlight` / `wrapEditorialNote` дедуплицированы: общий `findTextRange` + `styleMark`
- Шаринг хайлайтов: грузит данные всех глав, а не только первой
- Audio-player: устранён stale closure (isPlaying через ref), `goToTrack` обёрнут в `useCallback`

**7. Документация**
- AGENTS.md обновлён: размер ридера, маршруты book/[qualityTier], миграции 005/006, убраны мёртвые баги

---

## v6.2 — Авторизация через Magic Link + next-auth v5 (7 июня 2026)

### Что изменено

**1. Новая система авторизации (next-auth v5)**
- Установлен `next-auth@5.0.0-beta.25`
- Конфиг: `app/(auth)/auth.config.ts` — Credentials + Yandex + Google провайдеры (OAuth включается через env)
- `app/(auth)/auth.ts` — реэкспорт `signIn`, `signOut`, `auth`, handlers
- `app/(auth)/api/auth/[...nextauth]/route.ts` — next-auth обработчик на `/api/auth/*`

**2. Magic Link авторизация**
- Генерация 8-значного кода: `app/(auth)/actions.ts` → Server Action `createMagicLink`
- Верификация по ссылке: `GET /api/magic/verify?token=...` → помечает токен использованным → редирект на `/login?magic_email=...` → автовход
- Верификация по коду (dev): `POST /api/user/verify-code-direct` — вводишь код вручную
- В dev-режиме код выводится в консоль сервера и возвращается в UI
- Rate limit: 3 активных токена за 15 минут на email
- Таблица `magic_tokens` в Postgres (миграция: `postgres/migrations/001_magic_tokens.sql`)

**3. Страница `/login` переработана**
- Форма Magic Link (email → получить ссылку → ввести код)
- Кнопки «Войти через Яндекс» и «Войти через Google» (показываются если заданы OAuth ключи)
- Компонент `components/magic-link-form.tsx` в стиле canfly
- После успешного входа — редирект на `/profile`

**4. Роуты переорганизованы**
- Старые `/api/auth/login|logout|session` перемещены в `/api/user/login|logout|session` (не конфликтуют с next-auth)
- `components/book-reader.tsx` обновлён на `/api/user/session`

**5. Middleware (`proxy.ts`)**
- `/profile` защищён через next-auth JWT (`getToken()`)
- Авторизованный пользователь на `/login` → редирект на `/`
- `/api/auth/*` и `/api/magic/*` пропускаются без проверок

**6. `app/layout.tsx`** — добавлен `SessionProvider` из next-auth

### Как использовать

1. Накатить миграцию БД:
   ```bash
   psql $DATABASE_URL -f postgres/migrations/001_magic_tokens.sql
   ```

2. Заполнить `.env.local`:
   ```
   AUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=http://localhost:3000

   # Опционально — OAuth
   AUTH_YANDEX_CLIENT_ID=...
   AUTH_YANDEX_CLIENT_SECRET=...
   AUTH_GOOGLE_CLIENT_ID=...
   AUTH_GOOGLE_CLIENT_SECRET=...
   ```

3. Для OAuth добавить callback URL в консолях провайдеров:
   - `https://yourdomain.com/api/auth/callback/yandex`
   - `https://yourdomain.com/api/auth/callback/google`

4. В dev-режиме: открыть `/login`, ввести email → код появится в консоли сервера → ввести в форму.

### Зачем

Замена login/password авторизации на Magic Link убирает необходимость хранить пароли для читателей. Старая система (login/password через `/api/user/login`) сохранена для обратной совместимости.

---

## v6.0 — Студия персонажей + социальный профиль (7 июня 2026)

### Что изменено

**1. Студия для управления персонажами (`/studio/characters`)** — admin-only
- Список (responsive grid 1/2/3) с cover-градиентом, аватаром, bio, бейджами `reply_mode` и счётчиком способностей
- CRUD-страницы: новый, детальный (с табами Посты | Стена | О персонаже), редактирование
- Управление постами: composer (тип/текст/image upload через Vercel Blob/`scheduled_at`), таблица с индикатором scheduled, edit/delete
- Модерация стены: hide/unhide, удаление
- Доступ только для роли `admin` через `requireStudioAdminSession`

**2. Публичный профиль персонажа (`/characters/[slug]`) перестроен как соцсеть**
- Header: cover-градиент, аватар 128px, имя, bio, кнопки «Добавить/Удалить из друзей» и «Написать», блок статистики (друзья/посты/книги)
- 5 табов через query-param: Лента | О герое | Связи | Книги | Стена
- Стена: composer для зарегистрированных пользователей, удаление своих записей (или админом)
- Удалён canvas-граф связей и глобальная лента с `/characters`

**3. API и серверные функции**
- `GET|POST /api/characters/[slug]/wall`, `DELETE /api/characters/[slug]/wall/[id]` (автор или admin)
- `DELETE /api/characters/[slug]/friendship` (unfriend)
- `/api/characters/posts` — фильтр `scheduled_at` для публичной ленты
- `fetchCharacterStats`, `fetchCharacterFriends`, `deleteCharacterFriendship`

**4. Zod-схемы** — `lib/schemas/character-post.ts`
- Валидация для create/update character post и wall post через Zod (лимиты, типы, формат дат)
- Локализованные сообщения об ошибках

**5. Image polish** — `sizes` + `priority`
- 7 файлов получили `sizes` атрибут на `<Image fill>`
- `priority` для первых 3 карточек на `/characters`, `/shop`, `/books` (LCP fix)
- Результат: 0 LCP-warning, 0 missing-sizes warning в Playwright

**6. Техдолг**
- `lib/server/users.ts` — аннотация `UserRole[]` для устранения TS2345
- `app/api/admin/upload/route.ts` — убран `blob.size` (нет в типах)
- `/admin` — баннер-ссылка «Персонажи переехали в Студию»

**7. Инфраструктура тестирования**
- Playwright + ESLint v9 настроены
- `e2e/smoke.spec.ts` — 10 публичных роутов + 5 табов профиля
- `e2e/admin.spec.ts` — 6 admin-роутов (требует `ADMIN_TEST_EMAIL/PASSWORD`)
- `e2e/studio.spec.ts` — 3 studio-роута

### Зачем

Перенос управления персонажами в Студию (admin-only, role-based) и ребилд публичного профиля в стиле соцсети делают каталог героев живым: посты, друзья, читательская стена.

### Как использовать

- Студия: войти как `admin` → перейти в `/studio/characters`
- Баннер в `/admin` ведёт в Студию для удобства
- Smoke-тесты: `pnpm test:smoke` (без admin-сессии), `pnpm test:e2e` (полный прогон)
- Для локального тестирования studio/admin: `ADMIN_TEST_EMAIL=… ADMIN_TEST_PASSWORD=… pnpm test:e2e`

---

## v5.5 — Обновление зависимостей (7 июня 2026)

### Что изменено

Patch/minor-обновления без смены major-версий:

- **Next.js** 16.2.0 → 16.2.7, **React** / **React DOM** 19.2.4 → 19.2.7
- **Tailwind CSS** 4.2.2 → 4.3.0, **@tailwindcss/postcss**, **postcss**, **tailwind-merge**
- **Tiptap** (6 пакетов) 3.23.6 → 3.26.0 — редактор в studio
- **ai** 6.0.140 → 6.0.197 — чат с персонажами
- **react-hook-form**, **autoprefixer**, **date-fns** 4.4.0, **tw-animate-css** 1.4.0, **@types/react** 19.2.17

Major-обновления (zod 4, sonner 2, recharts 3, lucide-react 1 и др.) **не включены** — отложены до отдельного прохода.

### Зачем

Актуальные патчи безопасности и багфиксы в core-стеке (Next, React, Tailwind) без риска breaking changes.

### Как использовать

1. `pnpm install` (если клонировали репозиторий заново)
2. `pnpm build` — сборка проверена локально
3. `pnpm dev` — обычная разработка без изменений в workflow

---

## v5.4 — Vercel Web Analytics (7 июня 2026)

### Что изменено

- Установлен пакет `@vercel/analytics`
- В корневой layout (`app/layout.tsx`) добавлен компонент `<Analytics />` рядом с уже существующим `<SpeedInsights />`

### Зачем

Сбор анонимной статистики посещений (просмотры страниц, рефереры, устройства) в панели Vercel — дополняет Яндекс.Метрику и Speed Insights.

### Как использовать

1. Задеплойте проект на Vercel: `vercel --prod`
2. В [Vercel Dashboard](https://vercel.com) откройте проект → **Analytics** → включите Web Analytics, если ещё не включено
3. После деплоя откройте сайт в браузере — данные появятся в дашборде в течение нескольких минут
4. Локально (`pnpm dev`) аналитика не отправляется — только на production-домене Vercel

---

## v5.3 — Загрузка страниц комикса через Vercel Blob (29 мая 2026)

### Что изменено

- Добавлен API endpoint `/api/admin/upload` для загрузки изображений в Vercel Blob Storage
- Создан компонент `ComicPagesEditor` — визуальный редактор страниц комикса в админке
- Drag & drop для изменения порядка страниц
- Множественная загрузка файлов (можно выбрать несколько сразу)
- Превью миниатюр с кнопкой удаления
- Интеграция в форму редактирования книги (`book-form.tsx`)
- `preview_pages` теперь массив URL вместо текстового поля

### Как использовать

1. Открыть админку → Books → Edit/New
2. Для `type = 'comic'` появится визуальный редактор вместо текстового поля
3. Нажать "+ Добавить страницы" → выбрать файлы
4. Перетаскивать карточки для изменения порядка
5. Сохранить книгу — страницы автоматически появятся в `ComicReader`

### Требования

- Vercel Blob токены в `.env.local`:
  - `BLOB_READ_WRITE_TOKEN`
  - `BLOB_STORE_ID` (опционально)

---

## v5.2 — Webtoon-читалка для комиксов (29 мая 2026)

### Что изменено

- Создан новый компонент `components/comic-reader.tsx` — полноценная webtoon-читалка
- Комиксы (`type === 'comic'`) теперь открываются в отдельном режиме, минуя `BookReader`
- Вертикальный скролл: все страницы главы подряд, оптимизировано для мобильных
- Прогресс-бар вверху страницы (красная линия)
- UI автоскрывается через 3 сек при скролле, появляется при касании
- Миниатюры страниц внизу для быстрой навигации
- Клавиши ←/→/↑/↓ для навигации, F — полный экран
- Нативный Fullscreen API
- Lazy loading картинок (рендерятся только ±3 страницы от текущей)
- Блок покупки в конце комикса

### Как использовать

Просто открыть книгу с `type = 'comic'` — читалка подключится автоматически.

---



### Что изменено

- Добавлен динамический роутинг для глав: `/books/[slug]/[chapter]`
- Каждая глава теперь имеет уникальный URL (например, `/books/my-book/3`)
- Добавлены `id` атрибуты к заголовкам глав (`chapter-1`, `chapter-2`, и т.д.)
- Создана страница `/books/[slug]/full` для Safari Reader Mode — загружает все главы сразу
- Навигация по главам обновляет URL без перезагрузки страницы
- При закрытии и повторном открытии вкладки пользователь остаётся на той же главе

### Как использовать

1. **Постраничный режим**: `/books/my-book/1` — навигация по главам с интерактивными элементами
2. **Полная версия**: `/books/my-book/full` — все главы на одной странице для Safari Reader Mode
3. Кнопка "Полная версия" доступна в читалке для быстрого переключения
4. URL автоматически обновляется при переключении глав через оглавление или кнопки навигации

---

## v5.0 — Роли, профили и дружба с персонажами (28 мая 2026)

### Что изменено

- Добавлена SQL-миграция `scripts/005_social_roles_characters.sql` и обновлён `postgres/schema.sql`.
- Добавлены роли пользователей: `reader`, `author`, `editor`, `admin`.
- Добавлены reader-профили с временной cookie-идентификацией до подключения полноценной публичной авторизации.
- Добавлены дружба с персонажами, уровень близости, личные диалоги и сохранение истории сообщений.
- AI-чат теперь использует сохранённую историю диалога и расширенные настройки персонажа: манера речи, характер, границы знаний, политика спойлеров, режим ответов.
- На странице персонажа появилась кнопка “Добавить в друзья”, кнопка сообщения и блок книг с ролями персонажа.
- Добавлена страница `/profile` со списком персонажей-друзей, ролями и последними диалогами.
- Админ-форма персонажа расширена настройками AI-персоны и доступности сообщений.
- Добавлен пользовательский вход `/login` по `login/password`: если логина нет, создается reader-профиль.
- В админке появилась вкладка “Пользователи”: список пользователей, назначение ролей и смена пароля.

### Как использовать

1. Выполнить SQL из `scripts/005_social_roles_characters.sql` в Postgres.
2. В админке персонажа заполнить манеру речи, характер, границы знаний и режим ответа.
3. Открыть `/characters/[slug]`, добавить персонажа в друзья и перейти в чат.
4. Открыть `/profile`, чтобы увидеть друзей-персонажей и историю диалогов.
5. Открыть `/login`, чтобы войти или создать reader-профиль по login/password.

---

## v4.0 — Переход с Supabase на Neon/Postgres (24 мая 2026)

### Что изменено

- Серверные API routes и страницы переведены с Supabase SDK/PostgREST на прямые SQL-запросы через `pg`.
- Добавлен общий Postgres-клиент `lib/db.ts` и серверные репозитории для книг, персонажей и администраторов.
- Добавлен bootstrap schema-файл `postgres/schema.sql` для Neon/Vercel Postgres.
- Скрипт `pnpm db:structure` теперь читает структуру через `information_schema` из Postgres.
- Удалена зависимость `@supabase/ssr`; переменные Supabase больше не нужны приложению.

### Как использовать

1. Создать Neon/Vercel Postgres базу.
2. Выполнить SQL из `postgres/schema.sql`.
3. Добавить в `.env.local` `DATABASE_URL` или `POSTGRES_URL`.
4. Запустить `pnpm build` или `pnpm dev`.

---

## v3.0 — Главы книг и Markdown-читалка (16 мая 2026)

### Что изменено

**Новые файлы:**
- `supabase/migrations/20260516_add_chapters_to_books.sql` — миграция: поле `chapters JSONB` в таблице `books`
- `components/markdown-renderer.tsx` — рендер markdown с XSS-санитизацией (без внешних зависимостей)
- `app/admin/_components/chapter-editor.tsx` — редактор глав в админке (CRUD + порядок)

**Изменённые файлы:**
- `lib/types.ts` — добавлен интерфейс `BookChapter`, расширен `Book.chapters`
- `app/admin/_components/book-form.tsx` — для книг типа `book` показывается `ChapterEditor` вместо `preview_pages`
- `app/api/admin/books/route.ts` — валидация и сохранение `chapters` в POST
- `app/api/admin/books/[id]/route.ts` — валидация и сохранение `chapters` в PATCH
- `app/books/[slug]/page.tsx` — Reader поддерживает оба формата: картинки (комиксы) и главы (книги)

### Как использовать

**Создание книги с главами:**
1. В админке создать/редактировать книгу с типом `Книга`
2. Появится редактор глав вместо поля preview pages
3. Добавить главы с заголовком и markdown-содержимым
4. Сохранить

**Читалка:**
- Комиксы: постраничный просмотр картинок (без изменений)
- Книги: оглавление + навигация по главам + рендер markdown

**Применить миграцию БД** (если ещё не сделано):
```sql
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS chapters JSONB NOT NULL DEFAULT '[]'::jsonb;
```

---

## v2.0 — Социальная сеть персонажей и AI-чат

## ✅ Что было добавлено

### 1. Новые персонажи (3)
- [x] Соня - Хранительница снов
- [x] Турбокороль - Владыка скорости  
- [x] Убыр - Древний дух
- [x] Все они добавлены в таблицу characters с полным описанием

### 2. AI-чат с персонажами
- [x] API route `/api/characters/chat` для обработки сообщений
- [x] Компонент `CharacterChat` для отображения чата
- [x] Уникальные системные промпты для каждого персонажа (8 персонажей)
- [x] Streaming ответов от OpenAI GPT-4 Mini
- [x] Интеграция на странице персонажа `/characters/[slug]`
- [x] Автоскролл при новых сообщениях
- [x] Индикаторы загрузки

### 3. Социальная сеть персонажей
- [x] Таблица `character_posts` в Supabase
- [x] API route `/api/characters/posts` для получения постов
- [x] Компонент `CharacterPostsFeed` для отображения ленты
- [x] Три типа постов: мысли, анонсы, вопросы
- [x] Отображение с аватарами и временем
- [x] Демо-посты для всех персонажей

### 4. Обновлённое название проекта
- [x] "canfly | культура твоего сознания"
- [x] Обновлены все метаданные (title, description)
- [x] Обновлены footers на всех страницах
- [x] Обновлены логотипы/названия в headers

### 5. Обновлённые страницы
- [x] `/` - главная страница с новым названием
- [x] `/characters` - добавлена лента постов в стиле соцсети
- [x] `/characters/[slug]` - добавлен AI-чат с персонажем
- [x] `layout.tsx` - обновлены метаданные проекта

## 📋 Чек-лист для тестирования

### Перед запуском:
- [ ] Проверить что переменная `OPENAI_API_KEY` установлена в `.env.local`
- [ ] Убедиться что Supabase интеграция подключена

### Функциональность:
- [ ] Главная страница загружается и отображает новое название
- [ ] Можно перейти на `/characters`
- [ ] На странице персонажей видна лента постов
- [ ] Можно нажать на персонажа и открыть его профиль
- [ ] На профиле персонажа есть чат внизу
- [ ] Можно написать сообщение в чат
- [ ] Персонаж отвечает в его стиле
- [ ] Сообщения отображаются в реальном времени (streaming)
- [ ] Посты имеют разные типы (мысль, анонс, вопрос)
- [ ] Посты отсортированы по времени

### Персонажи для тестирования:
1. **Соня** (`/characters/sonya`)
   - Ожидается мягкий, философский тон
   - Говорит о снах и символах

2. **Турбокороль** (`/characters/turbokorol`)
   - Ожидается энергичный, быстрый стиль
   - Использует метафоры о скорости

3. **Убыр** (`/characters/ubyr`)
   - Ожидается глубокий, загадочный тон
   - Философствует о страхе и тени

## 🔧 Технические детали

### Использованные технологии:
- OpenAI GPT-4 Mini для AI-чата
- Supabase для хранения постов и связей
- Next.js 16 Route Handlers для API
- Streaming responses для плавного отображения

### Файлы которые были добавлены:
```
/app/api/characters/chat/route.ts       - AI-чат endpoint
/app/api/characters/posts/route.ts      - Посты endpoint
/components/character-chat.tsx          - Компонент чата
/components/character-posts-feed.tsx    - Лента постов
/FEATURES.md                            - Документация функций
/UPDATES.md                             - Этот файл
```

### Файлы которые были изменены:
```
/app/page.tsx                           - Обновлено название
/app/layout.tsx                         - Обновлены метаданные
/app/characters/page.tsx                - Добавлена лента постов
/app/characters/[slug]/page.tsx         - Добавлен чат
```

## 🚀 Следующие шаги

1. Проверить что всё работает в Preview
2. Убедиться что OpenAI API работает корректно
3. Добавить сохранение истории чата (опционально)
4. Добавить реакции к постам (лайки, комментарии)
5. Создать админ-интерфейс для добавления постов

## v6.1 — E2E test infrastructure (7 июня 2026)

### Изменено
- `e2e/setup/global-setup.ts` — NEW: идемпотентный upsert тестового админа (login `studio_test_admin`, email `studio-test-admin@canfly.test`, password `StudioTest_Admin_2026`) с ролью `admin` + запись в `admins` таблице. Грузит `.env.local` вручную (Playwright не пробрасывает env в globalSetup). Записывает креды в `e2e/.test-credentials.json` (gitignored).
- `e2e/setup/global-teardown.ts` — NEW: удаляет тестового пользователя и связанные `user_roles`.
- `e2e/setup/credentials.ts` — NEW: `loadTestCredentials()` хелпер для тестов.
- `e2e/admin.spec.ts` — переписан: логин через `/api/admin/login` (legacy password auth, `ADMIN_SESSION_COOKIE`). Skip если креды отсутствуют.
- `e2e/studio.spec.ts` — переписан: логин через `/api/auth/login` (new user auth, `USER_SESSION_COOKIE`). Hydration regression test на `/studio/characters/[id]` через рендер первой карточки.
- `playwright.config.ts` — добавлен `testIgnore: ['**/setup/**', '**/_helpers/**']` (хелперы не подхватываются как тесты), `globalSetup`/`globalTeardown`, timeout 60s (первая компиляция в dev).
- `.gitignore` — добавлен `e2e/.test-credentials.json`.

### Два независимых auth-флоу
- `/admin` (legacy) — `/api/admin/login` с `ADMIN_PASSWORD` env → `ADMIN_SESSION_COOKIE` → `admins` таблица
- `/studio` (новый) — `/api/auth/login` с login/password → `USER_SESSION_COOKIE` + `READER_PROFILE_COOKIE` → `users` + `user_roles` таблицы

### Результат
- 21/21 e2e тестов проходят (smoke 10 public + 1 profile tabs + admin 6 + studio 4)

### Зачем
- Раньше тесты логинились через неправильный эндпоинт: `/api/admin/login` ставит `ADMIN_SESSION_COOKIE`, который не читается `getCurrentUserFromCookie()`. Студийные тесты проходили «случайно» — `requireStudioSession()` возвращал null, layout редиректил на `/login` (307, что < 400 — тест думал, что ок). Теперь studio логинится через `/api/auth/login` и реально рендерит защищённые страницы.

---

## 📞 Support

Если что-то не работает:
1. Проверьте переменные окружения
2. Проверьте логи браузера (консоль)
3. Проверьте логи сервера
4. Убедитесь что Supabase таблицы созданы
