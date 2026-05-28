import { requireAdminSession } from '@/lib/admin-session'
import { createPasswordUser, listAdminUsers, normalizeLogin } from '@/lib/server/users'
import { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

function normalizeRoles(value: unknown): UserRole[] {
  if (!Array.isArray(value)) return ['reader']

  const roles = value.filter((role): role is UserRole =>
    role === 'reader' || role === 'author' || role === 'editor' || role === 'admin',
  )

  return roles.length > 0 ? roles : ['reader']
}

export async function GET() {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await listAdminUsers()
    return Response.json(users)
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const login = normalizeLogin(body.login)
    const password = typeof body.password === 'string' ? body.password : ''
    const displayName =
      typeof body.display_name === 'string' && body.display_name.trim()
        ? body.display_name.trim()
        : login

    if (!login || login.length < 3 || password.length < 6) {
      return Response.json(
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

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return Response.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
