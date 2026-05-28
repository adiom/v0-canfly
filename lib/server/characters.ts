import { dbQuery, dbQueryOne } from '@/lib/db'
import { Character, CharacterBookAppearance, CharacterRelationship } from '@/lib/types'

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
  books: CharacterBookAppearance[]
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

  let books: CharacterBookAppearance[] = []

  try {
    books = await fetchBooksForCharacter(character.id)
  } catch (error) {
    console.warn('Character book appearances are unavailable:', error)
  }

  return {
    character,
    relationships,
    books,
  }
}

export async function fetchBooksForCharacter(characterId: string) {
  return dbQuery<CharacterBookAppearance>(
    `
      SELECT
        b.id,
        b.title,
        b.slug,
        b.type,
        b.cover_image,
        bc.role,
        bc.importance_score
      FROM book_characters bc
      JOIN books b ON b.id = bc.book_id
      WHERE bc.character_id = $1
      ORDER BY
        CASE bc.role
          WHEN 'main' THEN 1
          WHEN 'supporting' THEN 2
          WHEN 'cameo' THEN 3
          ELSE 4
        END,
        bc.importance_score DESC,
        b.display_order ASC,
        b.created_at DESC
    `,
    [characterId],
  )
}

export async function fetchCharacterById(id: string) {
  return dbQueryOne<Character>('SELECT * FROM characters WHERE id = $1 LIMIT 1', [id])
}

export async function createCharacter(data: Record<string, unknown>) {
  return dbQueryOne<Character>(
    `
      INSERT INTO characters (
        name,
        slug,
        avatar,
        bio,
        full_description,
        abilities,
        speaking_style,
        personality,
        boundaries,
        knowledge_scope,
        spoiler_policy,
        reply_mode,
        can_receive_messages
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12::character_reply_mode, $13)
      RETURNING *
    `,
    [
      data.name,
      data.slug,
      data.avatar,
      data.bio,
      data.full_description,
      JSON.stringify(data.abilities ?? []),
      data.speaking_style,
      data.personality,
      data.boundaries,
      data.knowledge_scope,
      data.spoiler_policy,
      data.reply_mode ?? 'ai_auto',
      data.can_receive_messages ?? true,
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
        abilities = $7::jsonb,
        speaking_style = $8,
        personality = $9,
        boundaries = $10,
        knowledge_scope = $11,
        spoiler_policy = $12,
        reply_mode = $13::character_reply_mode,
        can_receive_messages = $14
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
      data.speaking_style,
      data.personality,
      data.boundaries,
      data.knowledge_scope,
      data.spoiler_policy,
      data.reply_mode ?? 'ai_auto',
      data.can_receive_messages ?? true,
    ],
  )
}

export async function deleteCharacter(id: string) {
  await dbQuery('DELETE FROM characters WHERE id = $1', [id])
}
