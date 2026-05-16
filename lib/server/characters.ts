import { createClient } from '@/lib/supabase/server'
import { Character, CharacterRelationship } from '@/lib/types'

export async function fetchCharactersList(): Promise<Character[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Character[]
}

export async function fetchRelationshipsForCharacters(
  characterIds: string[]
): Promise<CharacterRelationship[]> {
  if (characterIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('character_relationships')
    .select('*')
    .in('character_id', characterIds)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as CharacterRelationship[]
}

export async function fetchCharacterBySlug(slug: string): Promise<{
  character: Character
  relationships: CharacterRelationship[]
} | null> {
  const supabase = await createClient()
  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('slug', slug)
    .single()

  if (charError || !character) {
    return null
  }

  const { data: relationships, error: relError } = await supabase
    .from('character_relationships')
    .select('*')
    .eq('character_id', character.id)

  if (relError) {
    throw new Error(relError.message)
  }

  return {
    character: character as Character,
    relationships: (relationships ?? []) as CharacterRelationship[],
  }
}
