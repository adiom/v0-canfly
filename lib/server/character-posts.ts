import { dbQuery, dbQueryOne } from '@/lib/db'
import type {
  CharacterPost,
  CharacterPostType,
  CharacterPostWithCharacter,
} from '@/lib/types'

const VALID_POST_TYPES: CharacterPostType[] = ['thought', 'announcement', 'question']

export function normalizePostType(value: unknown): CharacterPostType {
  return typeof value === 'string' && VALID_POST_TYPES.includes(value as CharacterPostType)
    ? (value as CharacterPostType)
    : 'thought'
}

export async function listCharacterPostsAdmin(characterId: string) {
  return dbQuery<CharacterPost>(
    `SELECT id, character_id, content, post_type, image_url,
            scheduled_at, author_user_id, created_at
     FROM character_posts
     WHERE character_id = $1
     ORDER BY COALESCE(scheduled_at, created_at) DESC`,
    [characterId],
  )
}

export async function listVisibleCharacterPosts(characterSlug: string | null) {
  return dbQuery<CharacterPostWithCharacter>(
    `
      SELECT
        p.id,
        p.character_id,
        p.content,
        p.post_type,
        p.image_url,
        p.scheduled_at,
        p.author_user_id,
        p.created_at,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'avatar', c.avatar
        ) AS character
      FROM character_posts p
      JOIN characters c ON c.id = p.character_id
      WHERE ($1::text IS NULL OR c.slug = $1)
        AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())
      ORDER BY COALESCE(p.scheduled_at, p.created_at) DESC
    `,
    [characterSlug],
  )
}

export async function fetchCharacterPostById(id: string) {
  return dbQueryOne<CharacterPost>(
    `SELECT id, character_id, content, post_type, image_url,
            scheduled_at, author_user_id, created_at
     FROM character_posts
     WHERE id = $1
     LIMIT 1`,
    [id],
  )
}

export interface CreateCharacterPostInput {
  character_id: string
  content: string
  post_type: CharacterPostType
  image_url: string | null
  scheduled_at: string | null
  author_user_id: string | null
}

export async function createCharacterPost(data: CreateCharacterPostInput) {
  return dbQueryOne<CharacterPost>(
    `INSERT INTO character_posts
       (character_id, content, post_type, image_url, scheduled_at, author_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.character_id,
      data.content,
      data.post_type,
      data.image_url,
      data.scheduled_at,
      data.author_user_id,
    ],
  )
}

export interface UpdateCharacterPostInput {
  content: string
  post_type: CharacterPostType
  image_url: string | null
  scheduled_at: string | null
}

export async function updateCharacterPost(id: string, data: UpdateCharacterPostInput) {
  return dbQueryOne<CharacterPost>(
    `UPDATE character_posts
        SET content = $2,
            post_type = $3,
            image_url = $4,
            scheduled_at = $5
      WHERE id = $1
      RETURNING *`,
    [id, data.content, data.post_type, data.image_url, data.scheduled_at],
  )
}

export async function deleteCharacterPost(id: string) {
  await dbQuery('DELETE FROM character_posts WHERE id = $1', [id])
}

export async function countCharacterPosts(characterId: string) {
  const row = await dbQueryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM character_posts
     WHERE character_id = $1
       AND (scheduled_at IS NULL OR scheduled_at <= NOW())`,
    [characterId],
  )
  return row ? Number(row.count) : 0
}
