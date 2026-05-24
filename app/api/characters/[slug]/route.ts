import { fetchCharacterBySlug } from '@/lib/server/characters';
import { Character, CharacterRelationship } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const result = await fetchCharacterBySlug(slug);

    if (!result) {
      return Response.json({ error: 'Character not found' }, { status: 404 });
    }

    return Response.json({
      character: result.character as Character,
      relationships: result.relationships as CharacterRelationship[]
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return Response.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}
