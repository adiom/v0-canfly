import { createClient } from '@/lib/supabase/server';
import { Book } from '@/lib/types';

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured') === 'true';

  const supabase = await createClient();

  let query = supabase
    .from('books')
    .select('*')
    .order('display_order', { ascending: true });

  if (featured) {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching books:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data as Book[]);
}
