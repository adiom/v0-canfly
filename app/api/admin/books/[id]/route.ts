import { requireAdminSession } from '@/lib/admin-session'
import { supabaseAdminRequest } from '@/lib/supabase/admin-rest'
import { Book, BookChapter, BookType, BookWithCharacters } from '@/lib/types'

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

async function getBookCharacterIds(bookId: string) {
  const rows = await supabaseAdminRequest<Array<{ character_id: string }>>(
    `/rest/v1/book_characters?select=character_id&book_id=eq.${encodeURIComponent(bookId)}`,
  )

  return rows.map((row) => row.character_id)
}

async function updateBookCharacters(bookId: string, characterIds: string[]) {
  await supabaseAdminRequest(`/rest/v1/book_characters?book_id=eq.${encodeURIComponent(bookId)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  })

  if (characterIds.length === 0) {
    return
  }

  await supabaseAdminRequest('/rest/v1/book_characters', {
    method: 'POST',
    headers: {
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(
      characterIds.map((characterId) => ({
        book_id: bookId,
        character_id: characterId,
      })),
    ),
  })
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
    const searchParams = new URLSearchParams({
      select: '*',
      id: `eq.${id}`,
      limit: '1',
    })
    const books = await supabaseAdminRequest<Book[]>(`/rest/v1/books?${searchParams.toString()}`)

    if (!books[0]) {
      return Response.json({ error: 'Book not found' }, { status: 404 })
    }

    const characterIds = await getBookCharacterIds(id)

    return Response.json({
      ...books[0],
      character_ids: characterIds,
    } satisfies BookWithCharacters)
  } catch (error) {
    console.error('Error fetching admin book:', error)
    return Response.json({ error: 'Failed to fetch book' }, { status: 500 })
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
    const normalized = normalizeBookPayload(body)

    if ('error' in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 })
    }

    const books = await supabaseAdminRequest<Book[]>(
      `/rest/v1/books?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(normalized.data),
      },
    )

    if (!books[0]) {
      return Response.json({ error: 'Book not found' }, { status: 404 })
    }

    await updateBookCharacters(id, normalized.characterIds)

    return Response.json({
      ...books[0],
      character_ids: normalized.characterIds,
    } satisfies BookWithCharacters)
  } catch (error) {
    console.error('Error updating book:', error)
    return Response.json({ error: 'Failed to update book' }, { status: 500 })
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

    await supabaseAdminRequest<Book[]>(`/rest/v1/books?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Prefer: 'return=minimal',
      },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error deleting book:', error)
    return Response.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
