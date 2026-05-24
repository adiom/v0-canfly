import { dbQuery, dbQueryOne } from '@/lib/db'
import { Character, CharacterRelationship } from '@/lib/types'

export async function fetchCharactersList(): Promise<Character[]> {
  return dbQuery<Character>('SELECT * FROM characters ORDER BY created_at DESC')
}

export async function fetchRelationshipsForCharacters(
  characterIds: string[]
): Promise<CharacterRelationship[]> {
  if (characterIds.length === 0) {
    return []
  }

  return dbQuery<CharacterRelationship>(
    'SELECT * FROM character_relationships WHERE character_id = ANY($1::uuid[])',
    [characterIds],
  )
}

export async function fetchCharacterBySlug(slug: string): Promise<{
  character: Character
  relationships: CharacterRelationship[]
} | null> {
  const character = await dbQueryOne<Character>('SELECT * FROM characters WHERE slug = $1 LIMIT 1', [
    slug,
  ])

  if (!character) {
    return null
  }

  const relationships = await dbQuery<CharacterRelationship>(
    'SELECT * FROM character_relationships WHERE character_id = $1',
    [character.id],
  )

  return {
    character,
    relationships,
  }
}

export async function fetchCharacterById(id: string) {
  return dbQueryOne<Character>('SELECT * FROM characters WHERE id = $1 LIMIT 1', [id])
}

export async function createCharacter(data: Record<string, unknown>) {
  return dbQueryOne<Character>(
    `
      INSERT INTO characters (name, slug, avatar, bio, full_description, abilities)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `,
    [
      data.name,
      data.slug,
      data.avatar,
      data.bio,
      data.full_description,
      JSON.stringify(data.abilities ?? []),
    ],
  )
}

export async function updateCharacter(id: string, data: Record<string, unknown>) {
  return dbQueryOne<Character>(
    `
      UPDATE characters
      SET
        name = $2,
        slug = $3,
        avatar = $4,
        bio = $5,
        full_description = $6,
        abilities = $7::jsonb
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      data.name,
      data.slug,
      data.avatar,
      data.bio,
      data.full_description,
      JSON.stringify(data.abilities ?? []),
    ],
  )
}

export async function deleteCharacter(id: string) {
  await dbQuery('DELETE FROM characters WHERE id = $1', [id])
}
