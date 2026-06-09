'use server'

import { z } from 'zod'
import { dbQuery, dbQueryOne } from '@/lib/db'
import { signIn } from './auth'

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

const magicLoginSchema = emailSchema.extend({
  magicToken: z.string().min(1),
})

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data'
  redirectTo?: string
}

export interface CreateMagicLinkState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data'
  message?: string
  magicLink?: string
}

export const createMagicLink = async (
  _: CreateMagicLinkState,
  formData: FormData,
): Promise<CreateMagicLinkState> => {
  try {
    const validated = emailSchema.parse({ email: formData.get('email') })
    const { email } = validated

    // Чистим старые неиспользованные токены для этого email
    await dbQuery(
      `DELETE FROM magic_tokens
       WHERE email = $1 AND expires_at < NOW()`,
      [email],
    )

    // Rate limit: не более 3 активных токенов за 15 минут
    const recent = await dbQueryOne<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM magic_tokens
       WHERE email = $1 AND created_at > NOW() - INTERVAL '15 minutes' AND used = false`,
      [email],
    )

    if (recent && Number(recent.cnt) >= 3) {
      return {
        status: 'failed',
        message: 'Слишком много запросов. Попробуйте через 15 минут.',
      }
    }

    // Генерируем 8-значный числовой код
    const token = Math.floor(10000000 + Math.random() * 90000000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 минут

    await dbQuery(
      `INSERT INTO magic_tokens (token, email, expires_at)
       VALUES ($1, $2, $3)`,
      [token, email, expiresAt],
    )

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000'

    const magicLinkUrl = `${baseUrl}/api/magic/verify?token=${token}`

    // В dev-режиме возвращаем код прямо в ответе
    if (process.env.NODE_ENV === 'development') {
      console.log(`[magic-link] Код для ${email}: ${token}`)
      console.log(`[magic-link] Ссылка: ${magicLinkUrl}`)

      return {
        status: 'success',
        message: 'Код создан (смотри консоль сервера)',
        magicLink: token,
      }
    }

    console.log(`[magic-link] Код для ${email}: ${token}`)

    // TODO: здесь подключить отправку email (Resend, Nodemailer и т.д.)
    // await sendMagicLinkEmail({ to: email, token, magicLinkUrl })

    return {
      status: 'success',
      message: 'Ссылка отправлена на ваш email',
      magicLink: token,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data', message: 'Некорректный email' }
    }

    console.error('[magic-link] Ошибка создания:', error)
    return { status: 'failed', message: 'Внутренняя ошибка сервера' }
  }
}

export const loginWithMagicLink = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validated = magicLoginSchema.parse({
      email: formData.get('email'),
      magicToken: formData.get('magicToken'),
    })

    const result = await signIn('credentials', {
      email: validated.email,
      magicToken: validated.magicToken,
      redirect: false,
    })

    if (result?.error) return { status: 'failed' }

    return { status: 'success', redirectTo: '/profile' }
  } catch (error) {
    if (error instanceof z.ZodError) return { status: 'invalid_data' }
    return { status: 'failed' }
  }
}
