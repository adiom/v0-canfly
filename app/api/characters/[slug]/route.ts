import { createClient } from '@/lib/supabase/server';
import { Character, CharacterRelationship } from '@/lib/types';

export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get character
  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('slug', slug)
    .single();

  if (charError || !character) {
    return Response.json({ error: 'Character not found' }, { status: 404 });
  }

  // Get relationships
  const { data: relationships, error: relError } = await supabase
    .from('character_relationships')
    .select('*')
    .eq('character_id', character.id);

  if (relError) {
    console.error('Error fetching relationships:', relError);
    return Response.json(
      { error: relError.message },
      { status: 500 }
    );
  }

  return Response.json({
    character: character as Character,
    relationships: relationships as CharacterRelationship[]
  });
}
