# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**canfly** — артхаусное издательство комиксов, книг и аудиокниг. Веб-платформа с магазином, читалкой, AI-чатом с персонажами и авторской студией.

Язык интерфейса — **русский**. Код, переменные, коммиты — на английском.

## Commands

```bash
pnpm dev          # dev server (binds 0.0.0.0)
pnpm build        # production build (TS errors ignored via config)
pnpm lint         # eslint
pnpm db:structure # read DB schema via scripts/read-db-structure.mjs
```

No test runner is configured.

## Tech Stack

- **Next.js 16.2** (App Router), **React 19.2**, **TypeScript 5.7** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (new-york style, `components/ui/`)
- **Postgres** via `pg` Pool — no ORM. DB client: `lib/db.ts` (`dbQuery`, `dbQueryOne`)
- **Vercel Blob** for file uploads
- **Vercel AI SDK** (`ai` package) + OpenAI GPT-4o-mini for character chat
- Deployed on **Vercel**

## Architecture

### Data access pattern

All DB access goes through `lib/db.ts` which exposes a singleton `pg.Pool`. Domain queries live in `lib/server/*.ts` (books, characters, admins, users, highlights, search, chapters, editions, releases, series). API routes and Server Components call these directly — no client-side DB access (the browser Supabase client throws by design).

### Auth

Two separate auth systems, both use HMAC-signed tokens in cookies (no JWTs, no third-party auth):
- **Admin** (`lib/admin-auth.ts`): password-based, protected by middleware (`lib/supabase/middleware.ts`). Local dev skips auth for admin routes.
- **User** (`lib/user-auth.ts`): PBKDF2 password hashing, 30-day sessions. Cookie: `canfly-user-session`.

### Key routes

| Path | Purpose |
|---|---|
| `/` | Homepage with hero slider |
| `/books/[slug]` | Book detail + reader |
| `/books/[slug]/[chapter]` | Chapter reader |
| `/characters/[slug]` | Character profile |
| `/characters/[slug]/chat` | AI chat with character |
| `/shop` | Store |
| `/cart` | Shopping cart |
| `/admin` | Admin panel (CRUD for books, characters, slides, news, orders) |
| `/studio` | Author studio (series, editions, releases, chapters) |
| `/api/characters/chat` | Streaming AI chat endpoint |

### State

- Cart state: React Context (`lib/cart-context.tsx`), client-side only
- No global state library

### Database

Schema: `postgres/schema.sql`. Migrations in `postgres/migrations/`. Key tables: `books`, `characters`, `character_relationships`, `character_posts`, `orders`, `homepage_slides`, `admins`, `users`, `highlights`, `chapter_ratings`.

Server actions for studio: `lib/actions/studio.ts`.

## Conventions

- Server Components by default; `'use client'` only when interactive
- Path alias: `@/*` maps to project root
- Types in `lib/types.ts` and `lib/releases-types.ts`
- API responses: `{ data }` or `{ error }` with appropriate HTTP status
- shadcn/ui components in `components/ui/` — use `npx shadcn@latest add <component>`

### Design system

Dark theme with arthouse aesthetic:
- Background: `#111210`, `#1b1c19`
- Text: `#f4efe5`, `#ded7cc`
- Accent red: `#d52525`
- Secondary: `#f6d6a8`, `#9db5c8`, `#d7c6ad`
- Headers: `font-black uppercase`
- Small text: `text-xs uppercase tracking-[0.18em]`
- Containers: `max-w-7xl mx-auto px-4 md:px-8`
- Borders: `border-[#f4efe5]/10`, hover: `hover:border-[#f6d6a8]/45`

### Changelog

Update `UPDATES.md` when making user-facing changes (what, why, how to use).
