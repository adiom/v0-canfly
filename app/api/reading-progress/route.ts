import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server/session'
import { upsertReadingProgress } from '@/lib/server/reading-progress'
import { apiHandler } from '@/lib/api-handler'

/**
 * POST /api/reading-progress
 * Сохраняет прогресс чтения пользователя.
 * Требует авторизацию (гостевой прогресс через session_id не реализован —
 * только для залогиненных, как в ридере).
 */
async function saveReadingProgress(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { editionId, chapterId, progressPercent } = body ?? {}

  if (!editionId || !chapterId) {
    return NextResponse.json({ error: 'editionId and chapterId are required' }, { status: 400 })
  }
  if (typeof progressPercent !== 'number' || Number.isNaN(progressPercent)) {
    return NextResponse.json({ error: 'progressPercent must be a number' }, { status: 400 })
  }

  await upsertReadingProgress({
    editionId,
    chapterId,
    userId: user.id,
    progressPercent,
  })

  return NextResponse.json({ data: { ok: true } })
}

export const POST = apiHandler(saveReadingProgress)
