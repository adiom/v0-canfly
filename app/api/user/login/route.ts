import { NextRequest, NextResponse } from 'next/server'
import {
  createPasswordUser,
  findUserByLogin,
  normalizeLogin,
  READER_PROFILE_COOKIE,
} from '@/lib/server/users'
import { createUserToken, USER_SESSION_COOKIE, verifyPassword } from '@/lib/user-auth'
import { apiHandler } from '@/lib/api-handler'

async function postUserLogin(request: NextRequest) {
  const body = await request.json()
  const login = normalizeLogin(body.login)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!login || login.length < 3 || password.length < 6) {
    return NextResponse.json(
      { error: 'Логин от 3 символов, пароль от 6 символов' },
      { status: 400 },
    )
  }

  const existingUser = await findUserByLogin(login)
  let user

  if (existingUser) {
    const passwordValid = await verifyPassword(password, existingUser.password_hash)

    if (!passwordValid) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
    }

    user = existingUser
  } else {
    user = await createPasswordUser({
      login,
      password,
      displayName: login,
      roles: ['reader'],
    })
  }

  const token = await createUserToken(user.id)
  const response = NextResponse.json({
    data: {
      id: user.id,
      login: user.login,
      handle: user.handle,
      display_name: user.display_name,
    },
  })

  response.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  response.cookies.set(READER_PROFILE_COOKIE, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}

export const POST = apiHandler(postUserLogin)