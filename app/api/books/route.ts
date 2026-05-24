import { fetchBooks } from '@/lib/server/books';
import { BookWithCharacters } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const books = await fetchBooks({ featured });

    return Response.json(books as BookWithCharacters[]);
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
