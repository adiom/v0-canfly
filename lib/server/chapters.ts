import { dbQuery, dbQueryOne } from '@/lib/db'
import type { Chapter, ChapterVersion } from '@/lib/releases-types'

const chapterColumns = `
  id, edition_id, title, content, chapter_index,
  status, word_count, view_count,
  created_at, updated_at, published_at
`

const chapterListColumns = `
  id, edition_id, title, chapter_index,
  status, word_count, view_count,
  created_at, updated_at, published_at
`

export async function fetchChaptersByEdition(editionId: string) {
  return dbQuery<Chapter>(
    `SELECT ${chapterListColumns} FROM chapters
     WHERE edition_id = $1
     ORDER BY chapter_index ASC`,
    [editionId],
  )
}

export async function fetchPublishedChaptersByEdition(editionId: string) {
  return dbQuery<Chapter>(
    `SELECT ${chapterColumns} FROM chapters
     WHERE edition_id = $1 AND status = 'published'
     ORDER BY chapter_index ASC`,
    [editionId],
  )
}

export async function fetchChapterById(id: string) {
  return dbQueryOne<Chapter>(
    `SELECT ${chapterColumns} FROM chapters WHERE id = $1 LIMIT 1`,
    [id],
  )
}

export async function fetchChapterByEditionAndIndex(editionId: string, chapterIndex: number) {
  return dbQueryOne<Chapter>(
    `SELECT ${chapterColumns} FROM chapters
     WHERE edition_id = $1 AND chapter_index = $2 LIMIT 1`,
    [editionId, chapterIndex],
  )
}

export async function createChapter(data: Record<string, unknown>) {
  return dbQueryOne<Chapter>(
    `INSERT INTO chapters (edition_id, title, content, chapter_index, status, word_count)
     VALUES ($1, $2, $3, $4, $5::chapter_status, $6)
     RETURNING ${chapterColumns}`,
    [
      data.edition_id,
      data.title,
      data.content ?? null,
      data.chapter_index,
      data.status ?? 'draft',
      data.word_count ?? 0,
    ],
  )
}

export async function updateChapter(id: string, data: Record<string, unknown>) {
  return dbQueryOne<Chapter>(
    `UPDATE chapters SET
      title = $2, content = $3, chapter_index = $4,
      status = $5::chapter_status, word_count = $6
     WHERE id = $1
     RETURNING ${chapterColumns}`,
    [
      id,
      data.title,
      data.content ?? null,
      data.chapter_index,
      data.status ?? 'draft',
      data.word_count ?? 0,
    ],
  )
}

export async function publishChapter(id: string) {
  return dbQueryOne<Chapter>(
    `UPDATE chapters SET status = 'published', published_at = COALESCE(published_at, NOW())
     WHERE id = $1
     RETURNING ${chapterColumns}`,
    [id],
  )
}

export async function deleteChapter(id: string) {
  await dbQuery('DELETE FROM chapters WHERE id = $1', [id])
}

export async function incrementChapterViews(id: string) {
  await dbQuery('UPDATE chapters SET view_count = view_count + 1 WHERE id = $1', [id])
}

// --- Chapter Versions ---

export async function createChapterVersion(chapterId: string, content: string) {
  const last = await dbQueryOne<{ version_number: number }>(
    `SELECT version_number FROM chapter_versions
     WHERE chapter_id = $1 ORDER BY version_number DESC LIMIT 1`,
    [chapterId],
  )
  const nextVersion = (last?.version_number ?? 0) + 1

  return dbQueryOne<ChapterVersion>(
    `INSERT INTO chapter_versions (chapter_id, content, version_number)
     VALUES ($1, $2, $3)
     RETURNING id, chapter_id, content, version_number, created_at`,
    [chapterId, content, nextVersion],
  )
}

export async function fetchChapterVersions(chapterId: string) {
  return dbQuery<ChapterVersion>(
    `SELECT id, chapter_id, content, version_number, created_at
     FROM chapter_versions
     WHERE chapter_id = $1
     ORDER BY version_number DESC`,
    [chapterId],
  )
}

export async function fetchChapterVersion(versionId: string) {
  return dbQueryOne<ChapterVersion>(
    `SELECT id, chapter_id, content, version_number, created_at
     FROM chapter_versions WHERE id = $1 LIMIT 1`,
    [versionId],
  )
}

export async function restoreChapterVersion(chapterId: string, versionId: string) {
  const version = await fetchChapterVersion(versionId)
  if (!version || version.chapter_id !== chapterId) return null

  await createChapterVersion(chapterId, version.content)

  return dbQueryOne<Chapter>(
    `UPDATE chapters SET content = $2, word_count = $3
     WHERE id = $1
     RETURNING ${chapterColumns}`,
    [chapterId, version.content, version.content.split(/\s+/).filter(Boolean).length],
  )
}
