import { dbQuery, dbQueryOne } from '@/lib/db'
import type { Series } from '@/lib/releases-types'

const seriesColumns = `id, title, slug, description, created_at, updated_at`

export async function fetchAllSeries() {
  return dbQuery<Series>(
    `SELECT ${seriesColumns} FROM series ORDER BY title ASC`,
  )
}

export async function fetchSeriesById(id: string) {
  return dbQueryOne<Series>(
    `SELECT ${seriesColumns} FROM series WHERE id = $1 LIMIT 1`,
    [id],
  )
}


export async function createSeries(data: Record<string, unknown>) {
  return dbQueryOne<Series>(
    `INSERT INTO series (title, slug, description)
     VALUES ($1, $2, $3)
     RETURNING ${seriesColumns}`,
    [data.title, data.slug, data.description ?? null],
  )
}

export async function updateSeries(id: string, data: Record<string, unknown>) {
  return dbQueryOne<Series>(
    `UPDATE series SET title = $2, slug = $3, description = $4
     WHERE id = $1
     RETURNING ${seriesColumns}`,
    [id, data.title, data.slug, data.description ?? null],
  )
}

export async function deleteSeries(id: string) {
  await dbQuery('DELETE FROM series WHERE id = $1', [id])
}
