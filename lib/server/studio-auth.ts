import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import type { UserProfile, UserRole } from '@/lib/types'

export interface StudioSession {
  user: UserProfile
  roles: UserRole[]
}

const STUDIO_ROLES: UserRole[] = ['author', 'editor', 'admin']

export async function requireStudioSession(): Promise<StudioSession | null> {
  const user = await getCurrentUserFromCookie()
  if (!user) return null

  const roles = await getUserRoles(user.id)
  if (!roles.some(r => STUDIO_ROLES.includes(r))) return null

  return { user, roles }
}
