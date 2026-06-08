import type { DefaultSession, NextAuthConfig } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import Yandex from 'next-auth/providers/yandex'
import Google from 'next-auth/providers/google'

import { dbQuery, dbQueryOne } from '@/lib/db'
import type { UserProfile } from '@/lib/types'

export type UserType = 'regular'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      type: UserType
      login?: string | null
      handle?: string | null
      roles?: string[]
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    email?: string | null
    type: UserType
    login?: string | null
    handle?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    type: UserType
    login?: string | null
    handle?: string | null
    roles?: string[]
  }
}

async function findOrCreateUserByEmail(email: string, name?: string | null): Promise<UserProfile | null> {
  const existing = await dbQueryOne<UserProfile>(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email],
  )

  if (existing) return existing

  const handle = `user-${crypto.randomUUID().slice(0, 8)}`
  const created = await dbQueryOne<UserProfile>(
    `INSERT INTO users (email, handle, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, handle, name ?? handle],
  )

  if (created) {
    await dbQueryOne(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1, 'reader')
       ON CONFLICT DO NOTHING`,
      [created.id],
    )
  }

  return created
}

async function consumeMagicToken(email: string, token: string) {
  const claimed = await dbQueryOne<{ email: string }>(
    `
      UPDATE magic_tokens
      SET used = true
      WHERE token = $1
        AND lower(email) = lower($2)
        AND used = false
        AND expires_at >= NOW()
      RETURNING email
    `,
    [token, email],
  )

  return !!claimed
}

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    Credentials({
      credentials: {},
      async authorize(credentials) {
        const { email, magicToken } = credentials as { email?: string; magicToken?: string }
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
        const token = typeof magicToken === 'string' ? magicToken.trim() : ''
        if (!normalizedEmail || !token) return null

        const tokenValid = await consumeMagicToken(normalizedEmail, token)
        if (!tokenValid) return null

        const user = await findOrCreateUserByEmail(normalizedEmail)
        if (!user) return null

        return {
          id: user.id,
          email: user.email ?? normalizedEmail,
          name: user.display_name,
          type: 'regular' as UserType,
          login: user.login,
          handle: user.handle,
        }
      },
    }),

    ...(process.env.AUTH_YANDEX_CLIENT_ID && process.env.AUTH_YANDEX_CLIENT_SECRET
      ? [
          Yandex({
            clientId: process.env.AUTH_YANDEX_CLIENT_ID,
            clientSecret: process.env.AUTH_YANDEX_CLIENT_SECRET,
          }),
        ]
      : []),

    ...(process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') {
        if (!user?.email) return false

        try {
          const dbUser = await findOrCreateUserByEmail(user.email, user.name)
          if (!dbUser) return false

          user.id = dbUser.id
          ;(user as { type: UserType }).type = 'regular'
          ;(user as { handle?: string | null }).handle = dbUser.handle
          ;(user as { login?: string | null }).login = dbUser.login

          return true
        } catch (error) {
          console.error('[auth] signIn OAuth failed', error)
          return false
        }
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id as string
        token.type = (user as { type?: UserType }).type ?? token.type ?? 'regular'
        token.handle = (user as { handle?: string | null }).handle ?? token.handle
        token.login = (user as { login?: string | null }).login ?? token.login
      }

      if (!token.type) token.type = 'regular'

      if (token.sub) {
        const rows = await dbQuery<{ role: string }>(
          'SELECT role FROM user_roles WHERE user_id = $1',
          [token.sub],
        )
        token.roles = rows.map(r => r.role)
      }

      return token
    },

    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id
        session.user.type = (token.type as UserType) ?? 'regular'
        session.user.handle = token.handle ?? null
        session.user.login = token.login ?? null
        session.user.roles = token.roles as string[] ?? []
      }

      return session
    },
  },
  // secret берётся из AUTH_SECRET env переменной автоматически next-auth'ом
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig
