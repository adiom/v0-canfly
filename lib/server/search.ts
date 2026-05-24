import { dbQuery } from '@/lib/db'

export interface SearchResultBook {
  kind: 'book'
  id: string
  title: string
  slug: string
  type: string
  description: string | null
  cover_image: string | null
  label: string | null
}

export interface SearchResultCharacter {
  kind: 'character'
  id: string
  name: string
  slug: string
  bio: string | null
  avatar: string | null
}

export interface SearchResultNews {
  kind: 'news'
  id: string
  title: string
  section: string
  tag: string | null
  snippet: string | null
}

export interface SearchResults {
  books: SearchResultBook[]
  characters: SearchResultCharacter[]
  news: SearchResultNews[]
  total: number
  query: string
}

export interface AutocompleteItem {
  kind: 'book' | 'character' | 'news'
  id: string
  title: string
  subtitle: string
  href: string
  image: string | null
}

const BOOK_TYPE_LABELS: Record<string, string> = {
  comic: 'Комикс',
  book: 'Книга',
  audiobook: 'Аудиокнига',
}

export async function searchAll(q: string): Promise<SearchResults> {
  const pattern = `%${q.trim()}%`

  const rows = await dbQuery<{
    kind: string
    id: string
    title: string
    slug: string
    type: string | null
    description: string | null
    cover_image: string | null
    label: string | null
    bio: string | null
    avatar: string | null
    section: string | null
    tag: string | null
    snippet: string | null
  }>(
    `
    SELECT
      'book'          AS kind,
      id::text,
      title,
      slug,
      type::text      AS type,
      description,
      cover_image,
      label,
      NULL::text      AS bio,
      NULL::text      AS avatar,
      NULL::text      AS section,
      NULL::text      AS tag,
      NULL::text      AS snippet,
      CASE WHEN LOWER(title) LIKE LOWER($1) THEN 1 ELSE 2 END AS rank
    FROM books
    WHERE LOWER(title) LIKE LOWER($1)
       OR LOWER(description) LIKE LOWER($1)

    UNION ALL

    SELECT
      'character'     AS kind,
      id::text,
      name            AS title,
      slug,
      NULL::text      AS type,
      NULL::text      AS description,
      avatar          AS cover_image,
      NULL::text      AS label,
      bio,
      avatar,
      NULL::text      AS section,
      NULL::text      AS tag,
      NULL::text      AS snippet,
      CASE WHEN LOWER(name) LIKE LOWER($1) THEN 1 ELSE 2 END AS rank
    FROM characters
    WHERE LOWER(name) LIKE LOWER($1)
       OR LOWER(bio) LIKE LOWER($1)
       OR LOWER(full_description) LIKE LOWER($1)

    UNION ALL

    SELECT
      'news'          AS kind,
      id::text,
      title,
      ''              AS slug,
      NULL::text      AS type,
      content         AS description,
      NULL::text      AS cover_image,
      NULL::text      AS label,
      NULL::text      AS bio,
      NULL::text      AS avatar,
      section,
      tag,
      LEFT(content, 160) AS snippet,
      CASE WHEN LOWER(title) LIKE LOWER($1) THEN 1 ELSE 2 END AS rank
    FROM news_posts
    WHERE is_active = true
      AND (
        LOWER(title)   LIKE LOWER($1)
        OR LOWER(content) LIKE LOWER($1)
        OR LOWER(tag)     LIKE LOWER($1)
        OR LOWER(section) LIKE LOWER($1)
      )

    ORDER BY rank ASC, title ASC
    LIMIT 50
    `,
    [pattern],
  )

  const books: SearchResultBook[] = []
  const characters: SearchResultCharacter[] = []
  const news: SearchResultNews[] = []

  for (const row of rows) {
    if (row.kind === 'book') {
      books.push({
        kind: 'book',
        id: row.id,
        title: row.title,
        slug: row.slug,
        type: row.type ?? 'book',
        description: row.description,
        cover_image: row.cover_image,
        label: row.label,
      })
    } else if (row.kind === 'character') {
      characters.push({
        kind: 'character',
        id: row.id,
        name: row.title,
        slug: row.slug,
        bio: row.bio,
        avatar: row.avatar,
      })
    } else if (row.kind === 'news') {
      news.push({
        kind: 'news',
        id: row.id,
        title: row.title,
        section: row.section ?? '',
        tag: row.tag,
        snippet: row.snippet,
      })
    }
  }

  return { books, characters, news, total: books.length + characters.length + news.length, query: q }
}

export async function searchAutocomplete(q: string, limit = 5): Promise<AutocompleteItem[]> {
  const pattern = `%${q.trim()}%`
  const perKind = Math.max(2, Math.floor(limit / 2))

  const rows = await dbQuery<{
    kind: string
    id: string
    title: string
    slug: string
    type: string | null
    cover_image: string | null
    avatar: string | null
    label: string | null
    section: string | null
  }>(
    `
    (
      SELECT 'book' AS kind, id::text, title, slug, type::text AS type,
             cover_image, NULL::text AS avatar, label, NULL::text AS section
      FROM books
      WHERE LOWER(title) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1)
      ORDER BY CASE WHEN LOWER(title) LIKE LOWER($1) THEN 1 ELSE 2 END ASC, title ASC
      LIMIT $2
    )
    UNION ALL
    (
      SELECT 'character' AS kind, id::text, name AS title, slug, NULL AS type,
             NULL AS cover_image, avatar, NULL AS label, NULL AS section
      FROM characters
      WHERE LOWER(name) LIKE LOWER($1) OR LOWER(bio) LIKE LOWER($1)
      ORDER BY CASE WHEN LOWER(name) LIKE LOWER($1) THEN 1 ELSE 2 END ASC, name ASC
      LIMIT $2
    )
    UNION ALL
    (
      SELECT 'news' AS kind, id::text, title, '' AS slug, NULL AS type,
             NULL AS cover_image, NULL AS avatar, NULL AS label, section
      FROM news_posts
      WHERE is_active = true
        AND (LOWER(title) LIKE LOWER($1) OR LOWER(content) LIKE LOWER($1))
      ORDER BY CASE WHEN LOWER(title) LIKE LOWER($1) THEN 1 ELSE 2 END ASC, title ASC
      LIMIT $3
    )
    `,
    [pattern, perKind, Math.max(1, limit - perKind * 2)],
  )

  return rows.map((row) => {
    if (row.kind === 'book') {
      return {
        kind: 'book' as const,
        id: row.id,
        title: row.title,
        subtitle: BOOK_TYPE_LABELS[row.type ?? ''] ?? 'Книга',
        href: `/books/${row.slug}`,
        image: row.cover_image,
      }
    } else if (row.kind === 'character') {
      return {
        kind: 'character' as const,
        id: row.id,
        title: row.title,
        subtitle: 'Персонаж',
        href: `/characters/${row.slug}`,
        image: row.avatar,
      }
    } else {
      return {
        kind: 'news' as const,
        id: row.id,
        title: row.title,
        subtitle: row.section ?? 'Новости',
        href: `/news/${row.id}`,
        image: null,
      }
    }
  })
}
