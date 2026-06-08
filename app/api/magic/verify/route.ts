import { type NextRequest, NextResponse } from 'next/server'
import { dbQueryOne } from '@/lib/db'

interface MagicTokenRow {
  id: string
  token: string
  email: string
  expires_at: string
  used: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const record = await dbQueryOne<MagicTokenRow>(
      'SELECT * FROM magic_tokens WHERE token = $1 LIMIT 1',
      [token],
    )

    if (!record) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url))
    }

    if (record.used) {
      return NextResponse.redirect(new URL('/login?error=used_token', request.url))
    }

    // Редиректим на /login; одноразовый токен потребляется только credentials-провайдером.
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('magic_email', record.email)
    redirectUrl.searchParams.set('magic_token', token)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('[magic-verify] Ошибка:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
