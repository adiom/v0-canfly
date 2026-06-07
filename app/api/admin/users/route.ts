import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import { createPasswordUser, listAdminUsers, normalizeLogin } from '@/lib/server/users'
import { UserRole } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

function normalizeRoles(value: unknown): UserRole[] {
  if (!Array.isArray(value)) return ['reader']

  const roles = value.filter((role): role is UserRole =>
    role === 'reader' || role === 'author' || role === 'editor' || role === 'admin',
  )

  return roles.length > 0 ? roles : ['reader']
}

async function getAdminUsers(request: NextRequest) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await listAdminUsers()
  return NextResponse.json(users)
}

async function createAdminUser(request: NextRequest) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const login = normalizeLogin(body.login)
  const password = typeof body.password === 'string' ? body.password : ''
  const displayName =
    typeof body.display_name === 'string' && body.display_name.trim()
      ? body.display_name.trim()
      : login

  if (!login || login.length < 3 || password.length < 6) {
    return NextResponse.json(
      { error: 'Login must be at least 3 chars and password at least 6 chars' },
      { status: 400 },
    )
  }

  const user = await createPasswordUser({
    login,
    password,
    displayName,
    roles: normalizeRoles(body.roles),
  })

  return NextResponse.json(user, { status: 201 })
}

export const GET = apiHandler(getAdminUsers)
export const POST = apiHandler(createAdminUser)