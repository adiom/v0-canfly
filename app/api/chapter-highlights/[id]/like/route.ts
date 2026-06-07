import { getCurrentUserFromCookie } from '@/lib/server/users'
import { toggleHighlightLike } from '@/lib/server/chapter-highlights'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromCookie()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await toggleHighlightLike(id, user.id)
    if (!result) return Response.json({ error: 'Not Found or Forbidden' }, { status: 404 })
    return Response.json({ data: result })
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
