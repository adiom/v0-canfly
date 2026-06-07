import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { updateEditorialNoteStatus } from '@/lib/server/chapter-highlights'
import type { EditorialNoteStatus } from '@/lib/releases-types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getUserRoles(user.id)
    const canEdit = roles.includes('admin') || roles.includes('editor') || roles.includes('author')
    if (!canEdit) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const status = body.status as EditorialNoteStatus
    if (!['open', 'resolved', 'ignored'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await updateEditorialNoteStatus(id, status)
    if (!updated) return Response.json({ error: 'Not Found' }, { status: 404 })
    return Response.json({ data: updated })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
