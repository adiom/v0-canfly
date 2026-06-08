import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server/session'
import { apiHandler } from '@/lib/api-handler'

async function postFeedback(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, page } = await request.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 })
  }

  // Пока просто логируем в консоль (в будущем — сохранить в БД или отправить в Telegram/email)
  console.info('[feedback]', {
    userId: user.id,
    email: user.email,
    page: page ?? 'unknown',
    message: message.trim(),
    ts: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}

export const POST = apiHandler(postFeedback)
