import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { updateChapterHighlight, deleteChapterHighlight, fetchChapterHighlightById } from '@/lib/server/chapter-highlights'
import { apiHandler } from '@/lib/api-handler'

async function getChapterHighlightById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUser()
  const highlight = await fetchChapterHighlightById(id, user?.id ?? null)
  if (!highlight) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  return NextResponse.json({ data: highlight })
}

async function updateChapterHighlightById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles(user.id)
  const isAdmin = roles.includes('admin')

  const body = await request.json()
  const updated = await updateChapterHighlight(id, user.id, isAdmin, {
    note: body.note,
    is_public: body.is_public,
  })

  if (!updated) return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

async function deleteChapterHighlightById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles(user.id)
  const isAdmin = roles.includes('admin')

  const ok = await deleteChapterHighlight(id, user.id, isAdmin)
  if (!ok) return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 })
  return NextResponse.json({ data: { success: true } })
}

export const GET = apiHandler(getChapterHighlightById)
export const PATCH = apiHandler(updateChapterHighlightById)
export const DELETE = apiHandler(deleteChapterHighlightById)