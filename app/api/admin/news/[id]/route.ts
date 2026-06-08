import { NextRequest, NextResponse } from 'next/server'
import { requireStudioAdminSession } from '@/lib/server/studio-auth'
import {
  deleteNewsPost,
  fetchNewsPostById,
  updateNewsPost,
} from '@/lib/server/books'
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

async function getAdminNewsPost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const post = await fetchNewsPostById(id)

  if (!post) {
    return NextResponse.json({ error: 'News post not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

async function updateAdminNewsPost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const body = await request.json()
  const normalized = normalizeNewsPayload(body)

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 })
  }

  const post = await updateNewsPost(id, normalized.data)

  if (!post) {
    return NextResponse.json({ error: 'News post not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

async function deleteAdminNewsPost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }

  await deleteNewsPost(id)

  return NextResponse.json({ ok: true })
}

export const GET = apiHandler(getAdminNewsPost)
export const PATCH = apiHandler(updateAdminNewsPost)
export const DELETE = apiHandler(deleteAdminNewsPost)