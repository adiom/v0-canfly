import { createClient } from '@/lib/supabase/server';
import { Character } from '@/lib/types';

export const revalidate = 3600;

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching characters:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data as Character[]);
}
