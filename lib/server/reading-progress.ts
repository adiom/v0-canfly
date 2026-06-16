import { dbQueryOne } from '@/lib/db'

/**
 * Прогресс чтения пользователя по главе внутри издания.
 * upsert через UNIQUE-индекс idx_reading_progress_user_unique
 * (edition_id, chapter_id, user_id) — см. 002_release_system.sql.
 */
export async function upsertReadingProgress(params: {
  editionId: string
  chapterId: string
  userId: string
  progressPercent: number
}) {
  const clamped = Math.max(0, Math.min(100, params.progressPercent))
  return dbQueryOne(
    `INSERT INTO reading_progress (edition_id, chapter_id, user_id, progress_percent, last_read_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (edition_id, chapter_id, user_id)
     DO UPDATE SET progress_percent = EXCLUDED.progress_percent, last_read_at = NOW()
     RETURNING id`,
    [params.editionId, params.chapterId, params.userId, clamped],
  )
}

/** Последняя прочитанная позиция пользователя в издании (для resume-функционала). */
export async function fetchReadingProgress(editionId: string, userId: string) {
  return dbQueryOne<{ chapter_id: string; progress_percent: string }>(
    `SELECT chapter_id, progress_percent
     FROM reading_progress
     WHERE edition_id = $1 AND user_id = $2
     ORDER BY last_read_at DESC
     LIMIT 1`,
    [editionId, userId],
  )
}
