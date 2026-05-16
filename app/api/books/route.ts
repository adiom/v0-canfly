import { createClient } from '@/lib/supabase/server';
import { BookWithCharacters } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const supabase = await createClient();

    let query = supabase
      .from('books')
      .select('*, book_characters(characters(id, name, slug, avatar, bio))')
      .order('display_order', { ascending: true });

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const books = (data || []).map((book) => {
      const { book_characters, ...rest } = book;

      return {
        ...rest,
        characters: (book_characters || [])
          .map((row: { characters: unknown }) => row.characters)
          .filter(Boolean),
      };
    });

    return Response.json(books as BookWithCharacters[]);
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
