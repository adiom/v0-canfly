import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { fetchChapterEditorialNotes, createEditorialNote } from '@/lib/server/chapter-highlights'
import { apiHandler } from '@/lib/api-handler'

async function getChapterEditorialNotes(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')
  if (!chapterId) return NextResponse.json({ error: 'chapterId required' }, { status: 400 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles(user.id)
  const isTeam = roles.some(r => ['admin', 'editor', 'author'].includes(r))
  if (!isTeam) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const notes = await fetchChapterEditorialNotes(chapterId)
  return NextResponse.json({ data: notes })
}

async function createEditorialNoteHandler(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles(user.id)
  const canEdit = roles.includes('admin') || roles.includes('editor') || roles.includes('author')
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { chapter_id, text_content, paragraph_index, context_before, context_after, note } = body

  if (!chapter_id || !text_content || !note) {
    return NextResponse.json({ error: 'chapter_id, text_content, note required' }, { status: 400 })
  }

  const created = await createEditorialNote(user.id, {
    chapter_id,
    text_content,
    paragraph_index: paragraph_index ?? null,
    context_before: context_before ?? null,
    context_after: context_after ?? null,
    note,
  })

  return NextResponse.json({ data: created })
}

export const GET = apiHandler(getChapterEditorialNotes)
export const POST = apiHandler(createEditorialNoteHandler)