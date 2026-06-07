import { NextRequest, NextResponse } from 'next/server'
import { searchAutocomplete } from '@/lib/server/search'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

async function searchHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(Number(searchParams.get('limit') ?? '6'), 20)

  if (q.length < 2) {
    return NextResponse.json({ error: 'query too short' }, { status: 400 })
  }

  const results = await searchAutocomplete(q, limit)
  return NextResponse.json({ query: q, results })
}

export const GET = apiHandler(searchHandler)