import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import { createNewsPost, listAdminNewsPosts } from '@/lib/server/books'
import { apiHandler } from '@/lib/api-handler'

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

async function getAdminNews(request: NextRequest) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const posts = await listAdminNewsPosts()

  return NextResponse.json(posts)
}

async function postNews(request: NextRequest) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const normalized = normalizeNewsPayload(body)

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 })
  }

  const post = await createNewsPost(normalized.data)

  return NextResponse.json(post, { status: 201 })
}

export const GET = apiHandler(getAdminNews)
export const POST = apiHandler(postNews)