import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdminSession } from '@/lib/admin-session'
import { apiHandler } from '@/lib/api-handler'

async function postUpload(request: NextRequest) {
  const session = await requireAdminSession()

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

  console.log('[Upload] Uploading file:', file.name, 'size:', file.size, 'type:', file.type)

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' }, { status: 500 })
  }

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
    token,
  })

  console.log('[Upload] Success:', blob.url)

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
  })
}

export const POST = apiHandler(postUpload)