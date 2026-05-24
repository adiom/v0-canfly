import { fetchCharactersList } from '@/lib/server/characters';
import { Character } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchCharactersList();
    
    // Parse JSONB fields
    const parsedCharacters = data.map((character) => ({
      ...character,
      abilities: (() => {
        if (!character.abilities) return []
        if (Array.isArray(character.abilities)) return character.abilities
        if (typeof character.abilities === 'string') {
          try {
            const parsed = JSON.parse(character.abilities)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        return []
      })(),
    }));
    
    return Response.json(parsedCharacters as Character[]);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return Response.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}
