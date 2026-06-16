import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { dbQueryOne } from '@/lib/db'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'
import type { SessionUser } from '@/lib/server/session'

export interface StudioSession {
  user: SessionUser
  roles: UserRole[]
}

/** Результат проверки владения: сессия + release_id, к которому привязан ресурс. */
export interface OwnershipContext {
  session: StudioSession
  releaseId: string
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

/**
 * Проверяет, что текущий пользователь — owner релиза (release_collaborators.role='owner')
 * либо admin. Возвращает OwnershipContext с releaseId для переиспользования в action.
 * Бросает 'denied' через redirect, если доступа нет — как requireAuth в studio.ts.
 *
 * Это закрывает IDOR-уязвимость: ранее любой author/editor мог мутировать чужой релиз,
 * зная его UUID.
 */
export async function requireReleaseOwnership(releaseId: string): Promise<OwnershipContext> {
  const session = await requireStudioSession()
  if (!session) redirect('/login')

  // admin всегда имеет доступ
  if (session.roles.includes('admin')) {
    return { session, releaseId }
  }

  const link = await dbQueryOne<{ role: string }>(
    `SELECT role FROM release_collaborators
     WHERE release_id = $1 AND user_id = $2
     LIMIT 1`,
    [releaseId, session.user.id],
  )

  if (!link || link.role !== 'owner') redirect('/studio')

  return { session, releaseId }
}

/**
 * Извлекает release_id из editions.release_id и проверяет владение релизом.
 */
export async function requireEditionOwnership(editionId: string): Promise<OwnershipContext> {
  const edition = await dbQueryOne<{ release_id: string }>(
    'SELECT release_id FROM editions WHERE id = $1 LIMIT 1',
    [editionId],
  )
  if (!edition) redirect('/studio')
  return requireReleaseOwnership(edition.release_id)
}

/**
 * Извлекает цепочку chapter → edition → release и проверяет владение релизом.
 */
export async function requireChapterOwnership(chapterId: string): Promise<OwnershipContext> {
  const link = await dbQueryOne<{ release_id: string }>(
    `SELECT e.release_id
     FROM chapters c
     JOIN editions e ON e.id = c.edition_id
     WHERE c.id = $1
     LIMIT 1`,
    [chapterId],
  )
  if (!link) redirect('/studio')
  return requireReleaseOwnership(link.release_id)
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
