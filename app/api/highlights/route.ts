import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { createHighlight, fetchHighlights } from '@/lib/server/highlights'
import { HighlightType, HighlightVisibility } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return Response.json({ error: 'Book ID is required' }, { status: 400 })
    }

    const user = await getCurrentUserFromCookie()
    const roles = user ? await getUserRoles(user.id) : []
    const isTeam = roles.some(r => ['admin', 'editor', 'author'].includes(r))

    const highlights = await fetchHighlights({
      bookId,
      includeInternal: isTeam
    })

    return Response.json(highlights)
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserFromCookie()
    console.log('[POST /api/highlights] user:', user?.id ?? 'null')
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { book_id, chapter_index, text_content, comment, type, range_data } = body
    console.log('[POST /api/highlights] body:', { book_id, chapter_index, type, text_content: text_content?.slice(0, 50) })

    const roles = await getUserRoles(user.id)
    console.log('[POST /api/highlights] roles:', roles)
    const isAdmin = roles.includes('admin')
    const isEditor = roles.includes('editor')
    const isAuthor = roles.includes('author')

    // Determine default visibility and type based on role and request
    let highlightType: HighlightType = type || 'quote'
    let visibility: HighlightVisibility = 'public'

    if (highlightType === 'editorial_comment') {
      if (!isEditor && !isAdmin) {
        console.warn('[POST /api/highlights] Forbidden: not editor/admin')
        return Response.json({ error: 'Forbidden: Only editors can create editorial comments' }, { status: 403 })
      }
      visibility = 'internal'
    } else if (highlightType === 'author_note') {
      if (!isAuthor && !isAdmin) {
        console.warn('[POST /api/highlights] Forbidden: not author/admin')
        return Response.json({ error: 'Forbidden: Only authors can create author notes' }, { status: 403 })
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
      range_data
    })
    console.log('[POST /api/highlights] created:', highlight?.id ?? 'null (DB returned nothing)')

    return Response.json(highlight)
  } catch (err) {
    console.error('[POST /api/highlights] error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
