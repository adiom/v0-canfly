import { fetchCharactersList } from '@/lib/server/characters';
import { Character } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchCharactersList();
    return Response.json(data as Character[]);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return Response.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}
