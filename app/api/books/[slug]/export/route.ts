import { fetchBookBySlug } from '@/lib/server/books'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const book = await fetchBookBySlug(slug)

    if (!book) {
      return Response.json({ error: 'Book not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'text'

    if (format === 'json') {
      return Response.json({
        title: book.title,
        description: book.description,
        type: book.type,
        chapters: book.chapters || []
      })
    }

    // Default: Plain Text for TTS/CURL
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

    return new Response(output, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (err) {
    console.error('Export Error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
