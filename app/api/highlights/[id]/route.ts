import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { fetchHighlightById, updateHighlight, deleteHighlight } from '@/lib/server/highlights'
import { apiHandler } from '@/lib/api-handler'

async function getHighlightById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const highlight = await fetchHighlightById(id)

  if (!highlight) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  if (highlight.visibility !== 'public') {
    const user = await getCurrentUserFromCookie()
    const roles = user ? await getUserRoles(user.id) : []
    const isTeam = roles.some(r => ['admin', 'editor', 'author'].includes(r))
    const isOwner = user?.id === highlight.user_id

    if (!isTeam && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json(highlight)
}

async function updateHighlightById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const highlight = await fetchHighlightById(id)
  if (!highlight) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

  const roles = await getUserRoles(user.id)
  const isAdmin = roles.includes('admin')
  const isEditor = roles.includes('editor')
  const isAuthor = roles.includes('author')
  const isOwner = user.id === highlight.user_id

  const body = await request.json()
  const { status, comment, visibility } = body

  if (status && !isAdmin && !isEditor && !isAuthor) {
    return NextResponse.json({ error: 'Forbidden: Only team can update status' }, { status: 403 })
  }

  if ((comment || visibility) && !isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await updateHighlight(id, { status, comment, visibility })
  return NextResponse.json(updated)
}

async function deleteHighlightById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const highlight = await fetchHighlightById(id)
  if (!highlight) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

  const roles = await getUserRoles(user.id)
  const isAdmin = roles.includes('admin')
  const isOwner = user.id === highlight.user_id

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteHighlight(id)
  return NextResponse.json({ success: true })
}

export const GET = apiHandler(getHighlightById)
export const PATCH = apiHandler(updateHighlightById)
export const DELETE = apiHandler(deleteHighlightById)