import { auth } from '@/app/(auth)/auth'
import { dbQuery } from '@/lib/db'
import type { UserProfile, UserRole } from '@/lib/types'

export interface SessionUser {
  id: string
  email: string | null
  login: string | null
  handle: string | null
  display_name: string
  avatar: string | null
  bio: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const users = await dbQuery<UserProfile>(
    'SELECT id, email, login, handle, display_name, avatar, bio FROM users WHERE id = $1 LIMIT 1',
    [session.user.id],
  )
  const user = users[0]
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    login: user.login,
    handle: user.handle,
    display_name: user.display_name,
    avatar: user.avatar,
    bio: user.bio,
  }
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const rows = await dbQuery<{ role: string }>(
    'SELECT role FROM user_roles WHERE user_id = $1',
    [userId],
  )
  return rows.map(r => r.role as UserRole)
}
