import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { fetchChapterEditorialNotes, createEditorialNote } from '@/lib/server/chapter-highlights'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    if (!chapterId) return Response.json({ error: 'chapterId required' }, { status: 400 })

    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getUserRoles(user.id)
    const isTeam = roles.some(r => ['admin', 'editor', 'author'].includes(r))
    if (!isTeam) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const notes = await fetchChapterEditorialNotes(chapterId)
    return Response.json({ data: notes })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getUserRoles(user.id)
    const canEdit = roles.includes('admin') || roles.includes('editor') || roles.includes('author')
    if (!canEdit) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { chapter_id, text_content, paragraph_index, context_before, context_after, note } = body

    if (!chapter_id || !text_content || !note) {
      return Response.json({ error: 'chapter_id, text_content, note required' }, { status: 400 })
    }

    const created = await createEditorialNote(user.id, {
      chapter_id,
      text_content,
      paragraph_index: paragraph_index ?? null,
      context_before: context_before ?? null,
      context_after: context_after ?? null,
      note,
    })

    return Response.json({ data: created })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
