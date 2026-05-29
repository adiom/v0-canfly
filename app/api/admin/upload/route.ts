import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdminSession } from '@/lib/admin-session'

export async function POST(request: NextRequest) {
  const session = await requireAdminSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    console.log('[Upload] Uploading file:', file.name, 'size:', file.size, 'type:', file.type)

    // Загрузка в Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    console.log('[Upload] Success:', blob.url)

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size 
    })
  } catch (error) {
    console.error('[Upload] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 })
  }
}
