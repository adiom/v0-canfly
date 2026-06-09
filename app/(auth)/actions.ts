'use server'

import { z } from 'zod'
import { dbQuery, dbQueryOne } from '@/lib/db'
import { validateAndConsumeMagicToken } from '@/lib/server/magic-token'

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export interface CreateMagicLinkState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data'
  message?: string
  magicLink?: string
}

export interface ValidateCodeState {
  status: 'idle' | 'in_progress' | 'success' | 'failed'
  email?: string
  message?: string
}

export const createMagicLink = async (
  _: CreateMagicLinkState,
  formData: FormData,
): Promise<CreateMagicLinkState> => {
  try {
    const validated = emailSchema.parse({ email: formData.get('email') })
    const { email } = validated

    await dbQuery(
      `DELETE FROM magic_tokens
       WHERE email = $1 AND expires_at < NOW()`,
      [email],
    )

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

    const token = Math.floor(10000000 + Math.random() * 90000000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

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

export const validateMagicCode = async (
  _: ValidateCodeState,
  formData: FormData,
): Promise<ValidateCodeState> => {
  try {
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const code = formData.get('code')?.toString().trim()

    if (!email || !code) {
      return { status: 'failed', message: 'Неверный запрос' }
    }

    const data = await validateAndConsumeMagicToken(code)
    if (!data || data.email !== email) {
      return { status: 'failed', message: 'Неверный или просроченный код' }
    }

    return { status: 'success', email }
  } catch (error) {
    console.error('[magic-code] Ошибка:', error)
    return { status: 'failed', message: 'Внутренняя ошибка сервера' }
  }
}
