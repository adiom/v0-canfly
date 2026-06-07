import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { fetchChapterHighlights, createChapterHighlight } from '@/lib/server/chapter-highlights'
import { apiHandler } from '@/lib/api-handler'

async function getChapterHighlights(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')
  const userIdParam = searchParams.get('userId')
  const publicOnly = searchParams.get('publicOnly') === 'true'
  const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined

  if (!chapterId && !userIdParam) {
    return NextResponse.json({ error: 'chapterId or userId is required' }, { status: 400 })
  }

  const user = await getCurrentUserFromCookie()

  const highlights = await fetchChapterHighlights({
    chapterId: chapterId ?? undefined,
    userId: userIdParam ?? undefined,
    publicOnly,
    currentUserId: user?.id ?? null,
    limit,
  })

  return NextResponse.json({ data: highlights })
}

async function createChapterHighlightHandler(request: NextRequest) {
  const user = await getCurrentUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { chapter_id, text_content, paragraph_index, context_before, context_after, note, is_public } = body

  if (!chapter_id || !text_content) {
    return NextResponse.json({ error: 'chapter_id and text_content are required' }, { status: 400 })
  }
  if (text_content.length > 5000) {
    return NextResponse.json({ error: 'text_content too long' }, { status: 400 })
  }

  const highlight = await createChapterHighlight(user.id, {
    chapter_id,
    text_content,
    paragraph_index: paragraph_index ?? null,
    context_before: context_before ?? null,
    context_after: context_after ?? null,
    note: note ?? null,
    is_public: !!is_public,
  })

  if (!highlight) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  return NextResponse.json({ data: highlight })
}

export const GET = apiHandler(getChapterHighlights)
export const POST = apiHandler(createChapterHighlightHandler)