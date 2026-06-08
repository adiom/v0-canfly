import { NextRequest, NextResponse } from 'next/server'
import { requireStudioAdminSession } from '@/lib/server/studio-auth'
import { fetchUserById, setUserRoles, updateUserPassword } from '@/lib/server/users'
import { apiHandler } from '@/lib/api-handler'
import { normalizeRolesUpdate } from '@/lib/api/normalizers'

export const dynamic = 'force-dynamic'

async function updateAdminUser(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const body = await request.json()
  const user = await fetchUserById(id)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const roles = normalizeRolesUpdate(body.roles)

  if (roles) {
    await setUserRoles(id, roles)
  }

  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 chars' }, { status: 400 })
    }

    await updateUserPassword(id, body.password)
  }

  return NextResponse.json({ ok: true })
}

export const PATCH = apiHandler(updateAdminUser)