import { requireAdminSession } from '@/lib/admin-session'
import { supabaseAdminRequest } from '@/lib/supabase/admin-rest'
import { Book, BookType, BookWithCharacters } from '@/lib/types'

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
    },
    characterIds: normalizeCharacterIds(body.character_ids),
  }
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

export async function GET() {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const books = await supabaseAdminRequest<Book[]>(
      '/rest/v1/books?select=*&order=display_order.asc',
    )

    return Response.json(books)
  } catch (error) {
    console.error('Error fetching admin books:', error)
    return Response.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const normalized = normalizeBookPayload(body)

    if ('error' in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 })
    }

    const books = await supabaseAdminRequest<Book[]>('/rest/v1/books?select=*', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(normalized.data),
    })
    const book = books[0]

    if (!book) {
      return Response.json({ error: 'Failed to create book' }, { status: 500 })
    }

    await updateBookCharacters(book.id, normalized.characterIds)

    return Response.json(
      {
        ...book,
        character_ids: normalized.characterIds,
      } satisfies BookWithCharacters,
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating book:', error)
    return Response.json({ error: 'Failed to create book' }, { status: 500 })
  }
}
