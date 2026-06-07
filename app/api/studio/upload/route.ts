import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireStudioSession } from '@/lib/server/studio-auth'
import { apiHandler } from '@/lib/api-handler'

async function handler(request: NextRequest) {
  const session = await requireStudioSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' }, { status: 500 })
  }

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
    token,
  })

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
  })
}

export const POST = apiHandler(handler)