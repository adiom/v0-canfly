import { searchAutocomplete } from '@/lib/server/search'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(Number(searchParams.get('limit') ?? '6'), 20)

  if (q.length < 2) {
    return Response.json({ error: 'query too short' }, { status: 400 })
  }

  const results = await searchAutocomplete(q, limit)
  return Response.json({ query: q, results })
}
