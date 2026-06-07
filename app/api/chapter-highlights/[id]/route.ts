import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { updateChapterHighlight, deleteChapterHighlight, fetchChapterHighlightById } from '@/lib/server/chapter-highlights'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    const highlight = await fetchChapterHighlightById(id, user?.id ?? null)
    if (!highlight) return Response.json({ error: 'Not Found' }, { status: 404 })
    return Response.json({ data: highlight })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getUserRoles(user.id)
    const isAdmin = roles.includes('admin')

    const body = await request.json()
    const updated = await updateChapterHighlight(id, user.id, isAdmin, {
      note: body.note,
      is_public: body.is_public,
    })

    if (!updated) return Response.json({ error: 'Not Found or Forbidden' }, { status: 404 })
    return Response.json({ data: updated })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getUserRoles(user.id)
    const isAdmin = roles.includes('admin')

    const ok = await deleteChapterHighlight(id, user.id, isAdmin)
    if (!ok) return Response.json({ error: 'Not Found or Forbidden' }, { status: 404 })
    return Response.json({ data: { success: true } })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
