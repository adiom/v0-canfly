import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { createHighlight, fetchHighlights } from '@/lib/server/highlights'
import { HighlightType, HighlightVisibility } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

async function getHighlights(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  if (!bookId) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
  }

  const user = await getCurrentUserFromCookie()
  const roles = user ? await getUserRoles(user.id) : []
  const isTeam = roles.some(r => ['admin', 'editor', 'author'].includes(r))

  const highlights = await fetchHighlights({
    bookId,
    includeInternal: isTeam,
  })

  return NextResponse.json(highlights)
}

async function createHighlightHandler(request: NextRequest) {
  const user = await getCurrentUserFromCookie()
  console.log('[POST /api/highlights] user:', user?.id ?? 'null')
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { book_id, chapter_index, text_content, comment, type, range_data } = body
  console.log('[POST /api/highlights] body:', { book_id, chapter_index, type, text_content: text_content?.slice(0, 50) })

  const roles = await getUserRoles(user.id)
  console.log('[POST /api/highlights] roles:', roles)
  const isAdmin = roles.includes('admin')
  const isEditor = roles.includes('editor')
  const isAuthor = roles.includes('author')

  const highlightType: HighlightType = type || 'quote'
  let visibility: HighlightVisibility = 'public'

  if (highlightType === 'editorial_comment') {
    if (!isEditor && !isAdmin) {
      console.warn('[POST /api/highlights] Forbidden: not editor/admin')
      return NextResponse.json({ error: 'Forbidden: Only editors can create editorial comments' }, { status: 403 })
    }
    visibility = 'internal'
  } else if (highlightType === 'author_note') {
    if (!isAuthor && !isAdmin) {
      console.warn('[POST /api/highlights] Forbidden: not author/admin')
      return NextResponse.json({ error: 'Forbidden: Only authors can create author notes' }, { status: 403 })
    }
    visibility = 'internal'
  }

  console.log('[POST /api/highlights] creating highlight, type:', highlightType, 'visibility:', visibility)
  const highlight = await createHighlight({
    book_id,
    user_id: user.id,
    chapter_index,
    text_content,
    comment,
    type: highlightType,
    visibility,
    range_data,
  })
  console.log('[POST /api/highlights] created:', highlight?.id ?? 'null (DB returned nothing)')

  return NextResponse.json(highlight)
}

export const GET = apiHandler(getHighlights)
export const POST = apiHandler(createHighlightHandler)