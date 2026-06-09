import { type NextRequest, NextResponse } from 'next/server'
import { validateAndConsumeMagicToken } from '@/lib/server/magic-token'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const data = await validateAndConsumeMagicToken(token)

    if (!data) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('magic_email', data.email)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('[magic-verify] Ошибка:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
