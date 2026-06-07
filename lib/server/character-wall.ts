import { dbQuery, dbQueryOne } from '@/lib/db'
import type { CharacterWallPost, CharacterWallPostWithUser } from '@/lib/types'

export async function fetchWallPosts(
  characterId: string,
  { includeHidden = false, limit = 50, offset = 0 }: {
    includeHidden?: boolean
    limit?: number
    offset?: number
  } = {},
) {
  return dbQuery<CharacterWallPostWithUser>(
    `
      SELECT
        w.id,
        w.character_id,
        w.user_id,
        w.content,
        w.hidden,
        w.created_at,
        w.updated_at,
        json_build_object(
          'id', u.id,
          'handle', u.handle,
          'display_name', u.display_name,
          'avatar', u.avatar
        ) AS user
      FROM character_wall_posts w
      JOIN users u ON u.id = w.user_id
      WHERE w.character_id = $1
        AND ($2::boolean OR w.hidden = false)
      ORDER BY w.created_at DESC
      LIMIT $3
      OFFSET $4
    `,
    [characterId, includeHidden, limit, offset],
  )
}

export async function fetchWallPostById(id: string) {
  return dbQueryOne<CharacterWallPost>(
    'SELECT * FROM character_wall_posts WHERE id = $1 LIMIT 1',
    [id],
  )
}

export async function createWallPost(
  characterId: string,
  userId: string,
  content: string,
) {
  return dbQueryOne<CharacterWallPost>(
    `INSERT INTO character_wall_posts (character_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [characterId, userId, content],
  )
}

export async function deleteWallPost(id: string) {
  await dbQuery('DELETE FROM character_wall_posts WHERE id = $1', [id])
}

export async function setWallPostHidden(id: string, hidden: boolean) {
  return dbQueryOne<CharacterWallPost>(
    `UPDATE character_wall_posts
        SET hidden = $2
      WHERE id = $1
      RETURNING *`,
    [id, hidden],
  )
}
