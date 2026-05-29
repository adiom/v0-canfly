import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { fetchHighlightById, updateHighlight, deleteHighlight } from '@/lib/server/highlights'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const highlight = await fetchHighlightById(id)

    if (!highlight) {
      return Response.json({ error: 'Not Found' }, { status: 404 })
    }

    if (highlight.visibility !== 'public') {
      const user = await getCurrentUserFromCookie()
      const roles = user ? await getUserRoles(user.id) : []
      const isTeam = roles.some(r => ['admin', 'editor', 'author'].includes(r))
      const isOwner = user?.id === highlight.user_id

      if (!isTeam && !isOwner) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return Response.json(highlight)
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const highlight = await fetchHighlightById(id)
    if (!highlight) return Response.json({ error: 'Not Found' }, { status: 404 })

    const roles = await getUserRoles(user.id)
    const isAdmin = roles.includes('admin')
    const isEditor = roles.includes('editor')
    const isAuthor = roles.includes('author')
    const isOwner = user.id === highlight.user_id

    const body = await request.json()
    const { status, comment, visibility } = body

    // Logic for updating status (Author/Editor)
    if (status && !isAdmin && !isEditor && !isAuthor) {
      return Response.json({ error: 'Forbidden: Only team can update status' }, { status: 403 })
    }

    // Logic for updating comment/visibility (Owner/Admin)
    if ((comment || visibility) && !isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await updateHighlight(id, { status, comment, visibility })
    return Response.json(updated)
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const highlight = await fetchHighlightById(id)
    if (!highlight) return Response.json({ error: 'Not Found' }, { status: 404 })

    const roles = await getUserRoles(user.id)
    const isAdmin = roles.includes('admin')
    const isOwner = user.id === highlight.user_id

    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteHighlight(id)
    return Response.json({ success: true })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
