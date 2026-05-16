import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Успешный выход' })

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}

