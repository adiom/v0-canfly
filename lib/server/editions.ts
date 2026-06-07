import { dbQuery, dbQueryOne } from '@/lib/db'
import type { Edition } from '@/lib/releases-types'

const editionColumns = `
  id, release_id, format, platform, external_url,
  slug, status, is_primary, created_at, updated_at
`

export async function fetchEditionsByRelease(releaseId: string) {
  return dbQuery<Edition>(
    `SELECT ${editionColumns} FROM editions
     WHERE release_id = $1
     ORDER BY created_at ASC`,
    [releaseId],
  )
}

export async function fetchEditionById(id: string) {
  return dbQueryOne<Edition>(
    `SELECT ${editionColumns} FROM editions WHERE id = $1 LIMIT 1`,
    [id],
  )
}

export async function fetchEditionBySlug(slug: string) {
  return dbQueryOne<Edition>(
    `SELECT ${editionColumns} FROM editions WHERE slug = $1 LIMIT 1`,
    [slug],
  )
}

export async function createEdition(data: Record<string, unknown>) {
  return dbQueryOne<Edition>(
    `INSERT INTO editions (release_id, format, platform, external_url, slug, status, is_primary)
     VALUES ($1, $2::edition_format, $3, $4, $5, $6::edition_status, $7)
     RETURNING ${editionColumns}`,
    [
      data.release_id,
      data.format ?? 'book',
      data.platform ?? null,
      data.external_url ?? null,
      data.slug,
      data.status ?? 'draft',
      data.is_primary ?? false,
    ],
  )
}

export async function updateEdition(id: string, data: Record<string, unknown>) {
  return dbQueryOne<Edition>(
    `UPDATE editions SET
      format = $2::edition_format, platform = $3, external_url = $4,
      slug = $5, status = $6::edition_status, is_primary = $7
     WHERE id = $1
     RETURNING ${editionColumns}`,
    [
      id,
      data.format ?? 'book',
      data.platform ?? null,
      data.external_url ?? null,
      data.slug,
      data.status ?? 'draft',
      data.is_primary ?? false,
    ],
  )
}

export async function updateEditionStatus(id: string, status: string) {
  return dbQueryOne<Edition>(
    `UPDATE editions SET status = $2::edition_status WHERE id = $1 RETURNING ${editionColumns}`,
    [id, status],
  )
}

export async function deleteEdition(id: string) {
  await dbQuery('DELETE FROM editions WHERE id = $1', [id])
}
