import { type NextRequest, NextResponse } from 'next/server'
import { dbQueryOne } from '@/lib/db'
import { signIn } from '@/app/(auth)/auth'

interface MagicTokenRow {
  id: string
  token: string
  email: string
  expires_at: string
  used: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedCode = typeof code === 'string' ? code.trim() : ''

    if (!normalizedEmail || !normalizedCode) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }

    const record = await dbQueryOne<MagicTokenRow>(
      'SELECT * FROM magic_tokens WHERE token = $1 LIMIT 1',
      [normalizedCode],
    )

    if (!record) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 401 })
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Код истёк' }, { status: 401 })
    }

    if (record.used) {
      return NextResponse.json({ error: 'Код уже использован' }, { status: 401 })
    }

    if (record.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ error: 'Код не для этого email' }, { status: 401 })
    }

    // Авторизуем через next-auth credentials; provider атомарно потребит одноразовый код.
    const result = await signIn('credentials', {
      email: normalizedEmail,
      magicToken: normalizedCode,
      redirect: false,
    })

    if (result?.error) {
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[verify-code-direct] Ошибка:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
