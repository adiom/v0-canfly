import { dbQuery, dbQueryOne } from '@/lib/db'
import type {
  Release,
  ReleaseCharacter,
  ReleaseSeries,
  ReleaseCharacterRole,
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
  await dbQuery('DELETE FROM release_characters WHERE release_id = $1', [releaseId])
  if (characters.length === 0) return

  const values = characters.map((_, i) => `($1, $${i * 2 + 2}::uuid, $${i * 2 + 3}::release_character_role)`).join(', ')
  const params: unknown[] = [releaseId]
  for (const c of characters) {
    params.push(c.character_id, c.role)
  }

  await dbQuery(
    `INSERT INTO release_characters (release_id, character_id, role) VALUES ${values}
     ON CONFLICT DO NOTHING`,
    params,
  )
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
  await dbQuery('DELETE FROM release_series WHERE release_id = $1', [releaseId])
  if (series.length === 0) return

  const values = series.map((_, i) => `($1, $${i * 2 + 2}::uuid, $${i * 2 + 3})`).join(', ')
  const params: unknown[] = [releaseId]
  for (const s of series) {
    params.push(s.series_id, s.phase_number)
  }

  await dbQuery(
    `INSERT INTO release_series (release_id, series_id, phase_number) VALUES ${values}
     ON CONFLICT DO NOTHING`,
    params,
  )
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
