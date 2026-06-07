import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import {
  deleteBook,
  fetchBookById,
  getBookCharacterIds,
  updateBook,
  updateBookCharacters,
} from '@/lib/server/books'
import { Book, BookChapter, BookType, BookWithCharacters } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

const bookTypes: BookType[] = ['comic', 'book', 'audiobook']

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeCharacterIds(value: unknown) {
  return Array.from(new Set(normalizeStringArray(value)))
}

function normalizeExternalLinks(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, url]) => typeof url === 'string' && url.trim())
      .map(([store, url]) => [store.trim(), (url as string).trim()])
      .filter(([store]) => store),
  )
}

function normalizeChapters(value: unknown): BookChapter[] | { error: string } {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) return { error: 'chapters must be an array' }

  for (let i = 0; i < value.length; i++) {
    const item = value[i]
    if (!item || typeof item !== 'object') return { error: `chapter[${i}] must be an object` }
    const title = typeof (item as Record<string, unknown>).title === 'string'
      ? ((item as Record<string, unknown>).title as string).trim()
      : ''
    const content = typeof (item as Record<string, unknown>).content === 'string'
      ? ((item as Record<string, unknown>).content as string).trim()
      : ''
    if (!title) return { error: `chapter[${i}].title is required` }
    if (!content) return { error: `chapter[${i}].content is required` }
    if (title.length > 500) return { error: `chapter[${i}].title exceeds 500 chars` }
    if (content.length > 500_000) return { error: `chapter[${i}].content exceeds 500000 chars` }
  }

  return (value as Array<Record<string, unknown>>).map((ch) => ({
    title: (ch.title as string).trim(),
    content: (ch.content as string).trim(),
  }))
}

function normalizeBookPayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const type = bookTypes.includes(body.type as BookType) ? (body.type as BookType) : 'comic'
  const price = typeof body.price === 'number' && Number.isFinite(body.price) ? body.price : null
  const displayOrder =
    typeof body.display_order === 'number' && Number.isFinite(body.display_order)
      ? body.display_order
      : 0

  if (!title || !slug) {
    return { error: 'Title and slug are required' }
  }

  const chaptersResult = normalizeChapters(body.chapters)
  if ('error' in chaptersResult) {
    return { error: chaptersResult.error }
  }

  return {
    data: {
      title,
      slug,
      type,
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : null,
      cover_image:
        typeof body.cover_image === 'string' && body.cover_image.trim()
          ? body.cover_image.trim()
          : null,
      preview_pages: normalizeStringArray(body.preview_pages),
      external_links: normalizeExternalLinks(body.external_links),
      price,
      is_featured: Boolean(body.is_featured),
      display_order: displayOrder,
      ...(body.chapters !== undefined ? { chapters: chaptersResult } : {}),
    },
    characterIds: normalizeCharacterIds(body.character_ids),
  }
}

async function getAdminBook(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const book = await fetchBookById(id)

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const characterIds = await getBookCharacterIds(id)

  return NextResponse.json({
    ...book,
    character_ids: characterIds,
  } satisfies BookWithCharacters)
}

async function updateAdminBook(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const body = await request.json()
  const normalized = normalizeBookPayload(body)

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 })
  }

  const book = await updateBook(id, normalized.data)

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  await updateBookCharacters(id, normalized.characterIds)

  return NextResponse.json({
    ...book,
    character_ids: normalized.characterIds,
  } satisfies BookWithCharacters)
}

async function deleteAdminBook(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }

  await deleteBook(id)

  return NextResponse.json({ ok: true })
}

export const GET = apiHandler(getAdminBook)
export const PATCH = apiHandler(updateAdminBook)
export const DELETE = apiHandler(deleteAdminBook)