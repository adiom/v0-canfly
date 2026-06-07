import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

import { deleteWallPost, fetchWallPostById } from '@/lib/server/character-wall'
import { fetchCharacterById } from '@/lib/server/characters'
import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params

  const user = await getCurrentUserFromCookie()
  if (!user) {
    return Response.json({ error: 'Необходимо войти' }, { status: 401 })
  }

  const post = await fetchWallPostById(id)
  if (!post) {
    return Response.json({ error: 'Запись не найдена' }, { status: 404 })
  }

  const character = await fetchCharacterById(post.character_id)
  if (!character) {
    return Response.json({ error: 'Персонаж не найден' }, { status: 404 })
  }

  const roles = await getUserRoles(user.id)
  const isAdmin = roles.includes('admin')
  if (post.user_id !== user.id && !isAdmin) {
    return Response.json({ error: 'Нет доступа' }, { status: 403 })
  }

  await deleteWallPost(id)
  revalidatePath(`/characters/${character.slug}`)
  revalidatePath(`/studio/characters/${character.id}`)
  return Response.json({ data: { id } })
}
