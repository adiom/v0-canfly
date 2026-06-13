import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import type { UserRole } from '@/lib/types'
import type { SessionUser } from '@/lib/server/session'

export interface StudioSession {
  user: SessionUser
  roles: UserRole[]
}

const STUDIO_ROLES: UserRole[] = ['author', 'editor', 'admin']
const AUTHOR_OR_ADMIN_ROLES: UserRole[] = ['author', 'admin']

export async function requireStudioSession(): Promise<StudioSession | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const roles = await getUserRoles(user.id)
  if (!roles.some(r => STUDIO_ROLES.includes(r))) return null

  return { user, roles }
}

export async function requireStudioAdminSession(): Promise<StudioSession | null> {
  const session = await requireStudioSession()
  if (!session) return null
  if (!session.roles.includes('admin')) return null
  return session
}

export async function requireAuthorOrAdminSession(): Promise<StudioSession | null> {
  const session = await requireStudioSession()
  if (!session) return null
  if (!session.roles.some(r => AUTHOR_OR_ADMIN_ROLES.includes(r))) return null
  return session
}

export function isStudioAdmin(session: StudioSession | null | undefined) {
  return !!session?.roles.includes('admin')
}

export function isAuthorOrAdmin(session: StudioSession | null | undefined) {
  return !!session?.roles.some(r => AUTHOR_OR_ADMIN_ROLES.includes(r))
}
