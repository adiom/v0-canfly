# canfly SSO — Руководство для поддоменов

Интеграция единого входа для поддоменов canfly.org.

---

## Архитектура

```
canfly.org (OIDC Provider / Logto)
    │
    ├── Регистрация пользователей (magic link, Google, GitHub)
    ├── Хранение аккаунтов и ролей
    └── Выпуск токенов
         │
         ▼  OIDC Discovery
dev.canfly.org  (OIDC Client / Next.js)
kristina.canfly.org
banita.canfly.org
...
```

- **canfly.org** — центр аккаунтов, OIDC-провайдер (Logto)
- **Поддомены** — OIDC-клиенты, используют canfly.org для входа
- Пользователь логинится на canfly.org, перенаправляется обратно на поддомен с токеном

---

## Что нужно сделать поддомену

### Шаг 1. Зарегистрировать приложение в canfly.org

Попроси администратора canfly.org создать приложение в Logto:

1. Открыть Logto Admin → Applications → Create Application
2. Тип: **OIDC** (Regular App)
3. Имя: `dev.canfly.org` (или другое имя поддомена)
4. Redirect URI: `https://<поддомен>/api/auth/callback/canfly`
5. Скопировать **App ID** и **App Secret**

### Шаг 2. Установить зависимости

```bash
pnpm add next-auth@5.0.0-beta.25
```

### Шаг 3. Переменные окружения

Добавить в `.env.local`:

```env
# canfly SSO
AUTH_CANFLY_ISSUER=https://canfly.org/oidc
AUTH_CANFLY_CLIENT_ID=<App ID из Logto>
AUTH_CANFLY_CLIENT_SECRET=<App Secret из Logto>
NEXT_PUBLIC_CANFLY_SSO_ENABLED=true

# next-auth
AUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_BASE_URL=https://<поддомен>

# Postgres (тот же что на canfly.org)
DATABASE_URL=postgres://...
```

### Шаг 4. NextAuth конфиг

Создать файл `app/(auth)/auth.config.ts`:

```typescript
import type { DefaultSession, NextAuthConfig } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'

import { dbQuery, dbQueryOne } from '@/lib/db'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      login?: string | null
      handle?: string | null
      roles?: string[]
    } & DefaultSession['user']
  }
  interface User {
    id?: string
    email?: string | null
    login?: string | null
    handle?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    login?: string | null
    handle?: string | null
    roles?: string[]
  }
}

interface CanflyOidcProfile {
  sub: string
  email?: string | null
  name?: string | null
  picture?: string | null
  handle?: string | null
  login?: string | null
}

async function findOrCreateUserByEmail(email: string, name?: string | null) {
  const existing = await dbQueryOne(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email],
  )
  if (existing) return existing

  const handle = `user-${crypto.randomUUID().slice(0, 8)}`
  const created = await dbQueryOne(
    `INSERT INTO users (email, handle, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, handle, name ?? handle],
  )
  if (created) {
    await dbQueryOne(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'reader') ON CONFLICT DO NOTHING`,
      [created.id],
    )
  }
  return created
}

const canflyIssuer = process.env.AUTH_CANFLY_ISSUER?.replace(/\/$/, '')
const canflyWellKnown =
  process.env.AUTH_CANFLY_WELL_KNOWN ??
  (canflyIssuer ? `${canflyIssuer}/.well-known/openid-configuration` : undefined)

export const authConfig = {
  trustHost: true,
  pages: { signIn: '/login', newUser: '/' },
  providers: [
    // Magic link (по желанию)
    Credentials({
      credentials: {},
      async authorize(credentials) {
        const { email } = credentials as { email?: string }
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
        if (!normalizedEmail) return null
        const user = await findOrCreateUserByEmail(normalizedEmail)
        if (!user) return null
        return {
          id: user.id,
          email: user.email ?? normalizedEmail,
          name: user.display_name,
          login: user.login,
          handle: user.handle,
        }
      },
    }),

    // canfly SSO (OIDC)
    ...(canflyIssuer && canflyWellKnown &&
    process.env.AUTH_CANFLY_CLIENT_ID &&
    process.env.AUTH_CANFLY_CLIENT_SECRET
      ? [{
          id: 'canfly',
          name: 'canfly',
          type: 'oidc' as const,
          issuer: canflyIssuer,
          wellKnown: canflyWellKnown,
          clientId: process.env.AUTH_CANFLY_CLIENT_ID,
          clientSecret: process.env.AUTH_CANFLY_CLIENT_SECRET,
          profile(profile: CanflyOidcProfile) {
            return {
              id: profile.sub,
              email: profile.email,
              name: profile.name,
              image: profile.picture,
              login: profile.login,
              handle: profile.handle,
            }
          },
        }]
      : []),
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') {
        if (!user?.email) return false
        try {
          const dbUser = await findOrCreateUserByEmail(user.email, user.name)
          if (!dbUser) return false
          user.id = dbUser.id
          ;(user as { handle?: string | null }).handle = dbUser.handle
          ;(user as { login?: string | null }).login = dbUser.login
          return true
        } catch {
          return false
        }
      }
      return true
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        if (user.id) token.id = user.id as string
        token.handle = (user as { handle?: string | null }).handle ?? token.handle
        token.login = (user as { login?: string | null }).login ?? token.login
      }
      const uid = (user?.id as string | undefined) ?? token.sub
      if ((user || trigger === 'update') && uid) {
        try {
          const rows = await dbQuery<{ role: string }>(
            'SELECT role FROM user_roles WHERE user_id = $1',
            [uid],
          )
          token.roles = rows.map(r => r.role)
        } catch { /* empty */ }
      }
      if (!token.roles) token.roles = []
      return token
    },

    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id
        session.user.handle = token.handle ?? null
        session.user.login = token.login ?? null
        session.user.roles = (token.roles as string[]) ?? []
      }
      return session
    },
  },
} satisfies NextAuthConfig
```

### Шаг 5. NextAuth singleton

Создать `app/(auth)/auth.ts`:

```typescript
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig)
```

### Шаг 6. Route handler

Создать `app/api/auth/[...nextauth]/route.ts`:

```typescript
export { GET, POST } from '@/app/(auth)/auth'
```

### Шаг 7. SessionProvider в layout

В `app/layout.tsx` обернуть приложение:

```typescript
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Шаг 8. Кнопка входа на странице логина

```typescript
'use client'

import { signIn } from 'next-auth/react'

const isCanflySsoEnabled = process.env.NEXT_PUBLIC_CANFLY_SSO_ENABLED === 'true'

export function LoginForm() {
  return (
    <div>
      {isCanflySsoEnabled && (
        <button
          onClick={() => signIn('canfly', { callbackUrl: '/' })}
          className="w-full border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm font-bold uppercase text-amber-200 hover:bg-amber-900/30"
        >
          Войти через canfly
        </button>
      )}
    </div>
  )
}
```

### Шаг 9. Middleware (защита роутов)

Создать `middleware.ts` (или `proxy.ts` если следуешь convention canfly):

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Защищённые роуты
  if (pathname.startsWith('/profile') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*'],
}
```

---

## Тестирование

1. Запустить поддомен: `pnpm dev`
2. Открыть `/login`
3. Нажать «Войти через canfly»
4. Перенаправит на canfly.org → войти → вернёт обратно на поддомен
5. Проверить сессию: `useSession()` или `GET /api/auth/session`

---

## Таблица БД

Поддомен должен иметь доступ к тем же таблицам `users` и `user_roles`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  login TEXT UNIQUE,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reader','author','editor','admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
```

Если поддомен — отдельная БД, таблицы создаются автоматически через `findOrCreateUserByEmail`. Если общая БД — пользователи уже есть.

---

## Troubleshooting

| Проблема | Решение |
|---|---|
| Кнопка не показывается | Проверить `NEXT_PUBLIC_CANFLY_SSO_ENABLED=true` и перезапустить dev-сервер |
| `OIDC discovery failed` | Проверить `AUTH_CANFLY_ISSUER` (без `/` на конце) |
| `redirect_uri_mismatch` | Redirect URI в Logto должен совпадать: `https://<домен>/api/auth/callback/canfly` |
| Пользователь не создаётся | Проверить `DATABASE_URL` и наличие таблиц `users`/`user_roles` |
| Нет ролей | Проверить таблицу `user_roles` —canfly.org не передаёт роли, они хранятся локально |
