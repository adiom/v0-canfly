import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { apiHandler } from '@/lib/api-handler'

async function getCharacterPosts(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const characterSlug = searchParams.get('character')

  const data = await dbQuery(
    `
      SELECT
        p.id,
        p.content,
        p.post_type,
        p.image_url,
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

  return NextResponse.json(data)
}

export const GET = apiHandler(getCharacterPosts)