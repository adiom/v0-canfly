import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromCookie } from '@/lib/server/users'
import { toggleHighlightLike } from '@/lib/server/chapter-highlights'
import { apiHandler } from '@/lib/api-handler'

async function toggleChapterHighlightLike(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { id } = await context.params as { id: string }
  const user = await getCurrentUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await toggleHighlightLike(id, user.id)
  if (!result) return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 })
  return NextResponse.json({ data: result })
}

export const POST = apiHandler(toggleChapterHighlightLike)