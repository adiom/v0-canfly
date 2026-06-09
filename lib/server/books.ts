import { dbQuery, dbQueryOne } from '@/lib/db'
import { Book, BookWithCharacters } from '@/lib/types'

const bookColumns = `
  id,
  title,
  slug,
  type,
  description,
  cover_image,
  preview_pages,
  chapters,
  external_links,
  price::float8 AS price,
  is_featured,
  display_order,
  label,
  tone,
  created_at,
  updated_at
`

const prefixedBookColumns = `
  b.id,
  b.title,
  b.slug,
  b.type,
  b.description,
  b.cover_image,
  b.preview_pages,
  b.chapters,
  b.external_links,
  b.price::float8 AS price,
  b.is_featured,
  b.display_order,
  b.label,
  b.tone,
  b.created_at,
  b.updated_at
`

const booksWithCharactersSelect = `
  SELECT
    ${prefixedBookColumns},
    COALESCE(
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'avatar', c.avatar,
          'bio', c.bio
        )
        ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::json
    ) AS characters
  FROM books b
  LEFT JOIN book_characters bc ON bc.book_id = b.id
  LEFT JOIN characters c ON c.id = bc.character_id
`

export async function fetchBooks(options: { featured?: boolean } = {}) {
  const rows = await dbQuery<BookWithCharacters>(
    `
      ${booksWithCharactersSelect}
      WHERE ($1::boolean = false OR b.is_featured = true)
      GROUP BY b.id
      ORDER BY b.display_order ASC
    `,
    [Boolean(options.featured)],
  )

  return rows
}

export async function fetchBookById(id: string) {
  return dbQueryOne<Book>(`SELECT ${bookColumns} FROM books WHERE id = $1 LIMIT 1`, [id])
}

export async function fetchBookBySlug(slug: string): Promise<BookWithCharacters | null> {
  return dbQueryOne<BookWithCharacters>(
    `
      ${booksWithCharactersSelect}
      WHERE b.slug = $1
      GROUP BY b.id
      LIMIT 1
    `,
    [slug],
  )
}

export async function listAdminBooks() {
  return dbQuery<Book>(`SELECT ${bookColumns} FROM books ORDER BY display_order ASC`)
}

export async function createBook(data: Record<string, unknown>) {
  return dbQueryOne<Book>(
    `
      INSERT INTO books (
        title,
        slug,
        type,
        description,
        cover_image,
        preview_pages,
        external_links,
        price,
        is_featured,
        display_order,
        chapters
      )
      VALUES (
        $1,
        $2,
        $3::book_type,
        $4,
        $5,
        $6::jsonb,
        $7::jsonb,
        $8,
        $9,
        $10,
        COALESCE($11::jsonb, '[]'::jsonb)
      )
      RETURNING ${bookColumns}
    `,
    [
      data.title,
      data.slug,
      data.type,
      data.description,
      data.cover_image,
      JSON.stringify(data.preview_pages ?? []),
      JSON.stringify(data.external_links ?? {}),
      data.price,
      data.is_featured,
      data.display_order,
      JSON.stringify(data.chapters ?? []),
    ],
  )
}

export async function updateBook(id: string, data: Record<string, unknown>) {
  return dbQueryOne<Book>(
    `
      UPDATE books
      SET
        title = $2,
        slug = $3,
        type = $4::book_type,
        description = $5,
        cover_image = $6,
        preview_pages = $7::jsonb,
        external_links = $8::jsonb,
        price = $9,
        is_featured = $10,
        display_order = $11,
        chapters = COALESCE($12::jsonb, chapters)
      WHERE id = $1
      RETURNING ${bookColumns}
    `,
    [
      id,
      data.title,
      data.slug,
      data.type,
      data.description,
      data.cover_image,
      JSON.stringify(data.preview_pages ?? []),
      JSON.stringify(data.external_links ?? {}),
      data.price,
      data.is_featured,
      data.display_order,
      data.chapters === undefined ? null : JSON.stringify(data.chapters),
    ],
  )
}

export async function deleteBook(id: string) {
  await dbQuery('DELETE FROM books WHERE id = $1', [id])
}

export async function getBookCharacterIds(bookId: string) {
  const rows = await dbQuery<{ character_id: string }>(
    'SELECT character_id FROM book_characters WHERE book_id = $1',
    [bookId],
  )

  return rows.map((row) => row.character_id)
}

export async function updateBookCharacters(bookId: string, characterIds: string[]) {
  await dbQuery('DELETE FROM book_characters WHERE book_id = $1', [bookId])

  if (characterIds.length === 0) {
    return
  }

  await dbQuery(
    `
      INSERT INTO book_characters (book_id, character_id)
      SELECT $1::uuid, unnest($2::uuid[])
      ON CONFLICT DO NOTHING
    `,
    [bookId, characterIds],
  )
}

/** @deprecated Используй fetchRecentReleaseEvents из lib/server/releases.ts */
export async function fetchIssueBooks(limit = 4) {
  return dbQuery<Book>(
    `SELECT ${bookColumns} FROM books
     WHERE label IS NOT NULL
     ORDER BY display_order ASC, created_at DESC
     LIMIT $1`,
    [limit],
  )
}


