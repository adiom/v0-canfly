import { dbQuery } from '@/lib/db'

export async function GET(request: Request) {
  try {
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
    
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
