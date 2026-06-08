import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { updateEditorialNoteStatus } from '@/lib/server/chapter-highlights'
import type { EditorialNoteStatus } from '@/lib/releases-types'
import { apiHandler } from '@/lib/api-handler'

async function updateEditorialNoteStatusHandler(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles(user.id)
  const canEdit = roles.includes('admin') || roles.includes('editor') || roles.includes('author')
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const status = body.status as EditorialNoteStatus
  if (!['open', 'resolved', 'ignored'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await updateEditorialNoteStatus(id, status)
  if (!updated) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export const PATCH = apiHandler(updateEditorialNoteStatusHandler)