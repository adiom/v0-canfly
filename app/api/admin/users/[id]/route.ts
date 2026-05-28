import { requireAdminSession } from '@/lib/admin-session'
import { fetchUserById, setUserRoles, updateUserPassword } from '@/lib/server/users'
import { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

function normalizeRoles(value: unknown): UserRole[] | null {
  if (!Array.isArray(value)) return null

  const roles = value.filter((role): role is UserRole =>
    role === 'reader' || role === 'author' || role === 'editor' || role === 'admin',
  )

  return roles
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const user = await fetchUserById(id)

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const roles = normalizeRoles(body.roles)

    if (roles) {
      await setUserRoles(id, roles)
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return Response.json({ error: 'Password must be at least 6 chars' }, { status: 400 })
      }

      await updateUserPassword(id, body.password)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error updating admin user:', error)
    return Response.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
