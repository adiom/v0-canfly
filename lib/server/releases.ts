import { dbQuery, dbQueryOne, withTransaction } from '@/lib/db'
import type {
  Release,
  ReleaseStatus,
  EditionFormat,
  ReleaseCharacter,
  ReleaseSeries,
  ReleaseCharacterRole,
  ReleaseEvent,
} from '@/lib/releases-types'

const releaseColumns = `
  id, title, slug, description, cover_image, genre,
  release_date, isbn, authors, annotation, editor_notes,
  view_count, status, design_config, created_at, updated_at
`

export async function fetchReleases(options: { status?: string; limit?: number; offset?: number } = {}) {
  return dbQuery<Release>(
    `SELECT ${releaseColumns} FROM releases
     WHERE ($1::release_status IS NULL OR status = $1::release_status)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [options.status ?? null, options.limit ?? 50, options.offset ?? 0],
  )
}

export async function fetchReleaseById(id: string) {
  return dbQueryOne<Release>(
    `SELECT ${releaseColumns} FROM releases WHERE id = $1 LIMIT 1`,
    [id],
  )
}

export async function fetchReleaseBySlug(slug: string) {
  return dbQueryOne<Release>(
    `SELECT ${releaseColumns} FROM releases WHERE slug = $1 LIMIT 1`,
    [slug],
  )
}

export async function createRelease(data: Record<string, unknown>) {
  return dbQueryOne<Release>(
    `INSERT INTO releases (
      title, slug, description, cover_image, genre,
      release_date, isbn, authors, annotation, editor_notes, status
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8::jsonb, $9, $10, $11::release_status
    )
    RETURNING ${releaseColumns}`,
    [
      data.title,
      data.slug,
      data.description ?? null,
      data.cover_image ?? null,
      data.genre ?? null,
      data.release_date ?? null,
      data.isbn ?? null,
      JSON.stringify(data.authors ?? []),
      data.annotation ?? null,
      data.editor_notes ?? null,
      data.status ?? 'draft',
    ],
  )
}

export async function updateRelease(id: string, data: Record<string, unknown>) {
  return dbQueryOne<Release>(
    `UPDATE releases SET
      title = $2, slug = $3, description = $4, cover_image = $5, genre = $6,
      release_date = $7, isbn = $8, authors = $9::jsonb, annotation = $10,
      editor_notes = $11, status = $12::release_status
     WHERE id = $1
     RETURNING ${releaseColumns}`,
    [
      id,
      data.title,
      data.slug,
      data.description ?? null,
      data.cover_image ?? null,
      data.genre ?? null,
      data.release_date ?? null,
      data.isbn ?? null,
      JSON.stringify(data.authors ?? []),
      data.annotation ?? null,
      data.editor_notes ?? null,
      data.status ?? 'draft',
    ],
  )
}

export async function updateReleaseStatus(id: string, status: string) {
  return dbQueryOne<Release>(
    `UPDATE releases SET status = $2::release_status WHERE id = $1 RETURNING ${releaseColumns}`,
    [id, status],
  )
}

export async function updateReleaseDesign(id: string, config: Record<string, unknown>) {
  return dbQueryOne<Release>(
    `UPDATE releases SET design_config = $2::jsonb WHERE id = $1 RETURNING ${releaseColumns}`,
    [id, JSON.stringify(config)],
  )
}

export async function deleteRelease(id: string) {
  await dbQuery('DELETE FROM releases WHERE id = $1', [id])
}

// --- Release Characters ---

export async function fetchReleaseCharacters(releaseId: string) {
  return dbQuery<ReleaseCharacter>(
    `SELECT release_id, character_id, role FROM release_characters WHERE release_id = $1`,
    [releaseId],
  )
}

export async function setReleaseCharacters(
  releaseId: string,
  characters: { character_id: string; role: ReleaseCharacterRole }[],
) {
  // DELETE + INSERT в одной транзакции — иначе при конкурентной записи
  // можно потерять данные в окне между запросами.
  await withTransaction(async (client) => {
    await client.query('DELETE FROM release_characters WHERE release_id = $1', [releaseId])
    if (characters.length === 0) return

    const values = characters.map((_, i) => `($1, ${i * 2 + 2}::uuid, ${i * 2 + 3}::release_character_role)`).join(', ')
    const params: unknown[] = [releaseId]
    for (const c of characters) {
      params.push(c.character_id, c.role)
    }

    await client.query(
      `INSERT INTO release_characters (release_id, character_id, role) VALUES ${values}
       ON CONFLICT DO NOTHING`,
      params,
    )
  })
}

// --- Release Series ---

export async function fetchReleaseSeries(releaseId: string) {
  return dbQuery<ReleaseSeries>(
    `SELECT release_id, series_id, phase_number FROM release_series WHERE release_id = $1`,
    [releaseId],
  )
}

export async function setReleaseSeries(
  releaseId: string,
  series: { series_id: string; phase_number: number | null }[],
) {
  // Атомарная перезапись связей (см. setReleaseCharacters).
  await withTransaction(async (client) => {
    await client.query('DELETE FROM release_series WHERE release_id = $1', [releaseId])
    if (series.length === 0) return

    const values = series.map((_, i) => `($1, ${i * 2 + 2}::uuid, ${i * 2 + 3})`).join(', ')
    const params: unknown[] = [releaseId]
    for (const s of series) {
      params.push(s.series_id, s.phase_number)
    }

    await client.query(
      `INSERT INTO release_series (release_id, series_id, phase_number) VALUES ${values}
       ON CONFLICT DO NOTHING`,
      params,
    )
  })
}

export async function listReleasesByAuthor(userId: string) {
  return dbQuery<Release>(
    `SELECT ${releaseColumns} FROM releases r
     JOIN release_collaborators rc ON rc.release_id = r.id
     WHERE rc.user_id = $1
     ORDER BY r.updated_at DESC`,
    [userId],
  )
}

export async function listAllReleases() {
  return dbQuery<Release>(
    `SELECT ${releaseColumns} FROM releases r
     ORDER BY r.updated_at DESC`,
  )
}

type ReleaseWithEditionsMeta = Release & { formats: EditionFormat[]; edition_count: number }

const editionsMetaSelect = `
  COALESCE(
    json_agg(DISTINCT e.format) FILTER (WHERE e.format IS NOT NULL AND e.status != 'archived'),
    '[]'::json
  ) AS formats,
  (COUNT(e.id) FILTER (WHERE e.status != 'archived'))::integer AS edition_count
`

export async function listAllReleasesWithEditions() {
  return dbQuery<ReleaseWithEditionsMeta>(
    `SELECT r.id, r.title, r.slug, r.description, r.cover_image, r.genre,
            r.release_date, r.isbn, r.authors, r.annotation, r.editor_notes,
            r.view_count, r.status, r.design_config, r.created_at, r.updated_at,
            ${editionsMetaSelect}
     FROM releases r
     LEFT JOIN editions e ON e.release_id = r.id
     GROUP BY r.id
     ORDER BY r.updated_at DESC`,
  )
}

export async function listReleasesByAuthorWithEditions(userId: string) {
  return dbQuery<ReleaseWithEditionsMeta>(
    `SELECT r.id, r.title, r.slug, r.description, r.cover_image, r.genre,
            r.release_date, r.isbn, r.authors, r.annotation, r.editor_notes,
            r.view_count, r.status, r.design_config, r.created_at, r.updated_at,
            ${editionsMetaSelect}
     FROM releases r
     JOIN release_collaborators rc ON rc.release_id = r.id
     LEFT JOIN editions e ON e.release_id = r.id
     WHERE rc.user_id = $1
     GROUP BY r.id
     ORDER BY r.updated_at DESC`,
    [userId],
  )
}

// --- Releases with edition formats (catalog) ---

export async function fetchReleasesWithEditions(opts: { status?: ReleaseStatus } = {}) {
  return dbQuery<Release & { formats: EditionFormat[] }>(
    `SELECT r.id, r.title, r.slug, r.description, r.cover_image, r.genre,
            r.release_date, r.isbn, r.authors, r.annotation, r.editor_notes,
            r.view_count, r.status, r.design_config, r.created_at, r.updated_at,
            COALESCE(
              json_agg(DISTINCT e.format) FILTER (WHERE e.format IS NOT NULL),
              '[]'::json
            ) AS formats
     FROM releases r
     LEFT JOIN editions e ON e.release_id = r.id AND e.status = 'published'
     WHERE r.status = $1::release_status
     GROUP BY r.id
     ORDER BY r.release_date DESC NULLS LAST, r.created_at DESC`,
    [opts.status ?? 'published'],
  )
}

// --- Release Events (HomeIssuesSection) ---

export async function fetchRecentReleaseEvents(limit = 4) {
  return dbQuery<ReleaseEvent>(
    `
    SELECT 'new_edition' AS event_type,
           r.id AS release_id, r.title AS release_title, r.slug AS release_slug, r.cover_image,
           e.id AS edition_id, e.slug AS edition_slug, e.format,
           NULL AS chapter_title, NULL AS chapter_index,
           e.created_at AS event_at
    FROM editions e
    JOIN releases r ON r.id = e.release_id
    WHERE e.status = 'published' AND r.status = 'published'

    UNION ALL

    SELECT 'new_chapter' AS event_type,
           r.id AS release_id, r.title AS release_title, r.slug AS release_slug, r.cover_image,
           e.id AS edition_id, e.slug AS edition_slug, e.format,
           c.title AS chapter_title, c.chapter_index,
           COALESCE(c.published_at, c.created_at) AS event_at
    FROM chapters c
    JOIN editions e ON e.id = c.edition_id
    JOIN releases r ON r.id = e.release_id
    WHERE c.status = 'published'
      AND e.status = 'published'
      AND r.status = 'published'

    ORDER BY event_at DESC
    LIMIT $1
    `,
    [limit],
  )
}
