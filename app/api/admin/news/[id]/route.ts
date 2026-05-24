import { requireAdminSession } from '@/lib/admin-session'
import {
  deleteNewsPost,
  fetchNewsPostById,
  updateNewsPost,
} from '@/lib/server/books'

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const post = await fetchNewsPostById(id)

    if (!post) {
      return Response.json({ error: 'News post not found' }, { status: 404 })
    }

    return Response.json(post)
  } catch (error) {
    console.error('Error fetching admin news post:', error)
    return Response.json({ error: 'Failed to fetch news post' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const normalized = normalizeNewsPayload(body)

    if ('error' in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 })
    }

    const post = await updateNewsPost(id, normalized.data)

    if (!post) {
      return Response.json({ error: 'News post not found' }, { status: 404 })
    }

    return Response.json(post)
  } catch (error) {
    console.error('Error updating news post:', error)
    return Response.json({ error: 'Failed to update news post' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await deleteNewsPost(id)

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error deleting news post:', error)
    return Response.json({ error: 'Failed to delete news post' }, { status: 500 })
  }
}
