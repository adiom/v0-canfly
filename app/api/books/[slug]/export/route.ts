import { NextRequest, NextResponse } from 'next/server'
import { fetchBookBySlug } from '@/lib/server/books'
import { apiHandler } from '@/lib/api-handler'

async function exportBook(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const book = await fetchBookBySlug(slug)

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'text'

  if (format === 'json') {
    return NextResponse.json({
      title: book.title,
      description: book.description,
      type: book.type,
      chapters: book.chapters || [],
    })
  }

  let output = `TITLE: ${book.title}\n`
  if (book.description) output += `DESCRIPTION: ${book.description}\n`
  output += `TYPE: ${book.type}\n`
  output += `------------------------------------------\n\n`

  if (book.chapters && book.chapters.length > 0) {
    book.chapters.forEach((ch, i) => {
      output += `CHAPTER ${i + 1}: ${ch.title}\n`
      output += `==========================================\n`
      output += `${ch.content}\n\n`
    })
  } else {
    output += `(No text content available for this book type)\n`
  }

  return new NextResponse(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export const GET = apiHandler(exportBook)