import { NextRequest, NextResponse } from 'next/server'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { requireChapterOwnership } from '@/lib/server/studio-auth'
import { apiHandler } from '@/lib/api-handler'

const MAX_AUDIO_SIZE = 500 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
]
const ALLOWED_EXTENSIONS = new Set(['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac'])

function getSafeFilename(filename: string) {
  const normalized = filename.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-')
  const fallback = normalized || 'track.mp3'
  return fallback.slice(-180)
}

async function handler(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    chapterId?: string
    filename?: string
    contentType?: string
    size?: number
  } | null

  if (!body?.chapterId || !body.filename || !body.contentType || typeof body.size !== 'number') {
    return NextResponse.json({ error: 'Некорректные данные файла' }, { status: 400 })
  }

  if (body.size <= 0 || body.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: 'Аудиофайл должен быть не больше 500 МБ' }, { status: 400 })
  }

  const extension = body.filename.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_CONTENT_TYPES.includes(body.contentType) && !ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: 'Поддерживаются только m4a, mp3, aac, ogg, wav, flac' }, { status: 400 })
  }

  await requireChapterOwnership(body.chapterId)

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' }, { status: 500 })
  }

  const pathname = `audio/chapters/${body.chapterId}/${Date.now()}-${getSafeFilename(body.filename)}`
  const clientToken = await generateClientTokenFromReadWriteToken({
    token,
    pathname,
    allowedContentTypes: ALLOWED_CONTENT_TYPES,
    maximumSizeInBytes: MAX_AUDIO_SIZE,
    validUntil: Date.now() + 15 * 60 * 1000,
    addRandomSuffix: true,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ token: clientToken, pathname })
}

export const POST = apiHandler(handler)
