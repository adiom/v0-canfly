import { NextRequest, NextResponse } from 'next/server'
import { requireStudioAdminSession } from '@/lib/server/studio-auth'
import {
  deleteNewsPost,
  fetchNewsPostById,
  updateNewsPost,
} from '@/lib/server/books'
import { apiHandler } from '@/lib/api-handler'
import { normalizeNewsPayload } from '@/lib/api/normalizers'

export const dynamic = 'force-dynamic'

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