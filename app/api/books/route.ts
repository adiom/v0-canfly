import { NextRequest, NextResponse } from 'next/server'
import { fetchBooks } from '@/lib/server/books'
import { BookWithCharacters } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

async function getBooks(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const featured = searchParams.get('featured') === 'true'

  const books = await fetchBooks({ featured })

  return NextResponse.json(books as BookWithCharacters[])
}

export const GET = apiHandler(getBooks)