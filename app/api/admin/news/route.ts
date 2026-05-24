import { requireAdminSession } from '@/lib/admin-session'
import { createNewsPost, listAdminNewsPosts } from '@/lib/server/books'

export const dynamic = 'force-dynamic'

function normalizeNewsPayload(body: Record<string, unknown>) {
  const section = typeof body.section === 'string' ? body.section.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''

  if (!section || !title) {
    return { error: 'Section and title are required' }
  }

  return {
    data: {
      section,
      title,
      content: typeof body.content === 'string' && body.content.trim() ? body.content.trim() : null,
      tag: typeof body.tag === 'string' && body.tag.trim() ? body.tag.trim() : null,
      display_order: typeof body.display_order === 'number' ? body.display_order : 0,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
    },
  }
}

export async function GET() {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await listAdminNewsPosts()

    return Response.json(posts)
  } catch (error) {
    console.error('Error fetching admin news:', error)
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const normalized = normalizeNewsPayload(body)

    if ('error' in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 })
    }

    const post = await createNewsPost(normalized.data)

    return Response.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating news post:', error)
    return Response.json({ error: 'Failed to create news post' }, { status: 500 })
  }
}
