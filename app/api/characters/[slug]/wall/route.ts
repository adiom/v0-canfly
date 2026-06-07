import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

import { fetchCharacterBySlug } from '@/lib/server/characters'
import {
  createWallPost,
  fetchWallPosts,
} from '@/lib/server/character-wall'
import { getCurrentUserFromCookie } from '@/lib/server/users'
import { formatZodError, wallPostSchema } from '@/lib/schemas/character-post'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const data = await fetchCharacterBySlug(slug)
  if (!data?.character) {
    return Response.json({ error: 'Character not found' }, { status: 404 })
  }

  const posts = await fetchWallPosts(data.character.id, {
    includeHidden: false,
    limit: 50,
  })

  return Response.json({ data: { posts } })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const data = await fetchCharacterBySlug(slug)
  if (!data?.character) {
    return Response.json({ error: 'Character not found' }, { status: 404 })
  }

  const user = await getCurrentUserFromCookie()
  if (!user) {
    return Response.json({ error: 'Необходимо войти' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = wallPostSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: formatZodError(parsed.error) },
      { status: 400 },
    )
  }

  const post = await createWallPost(data.character.id, user.id, parsed.data.content)
  revalidatePath(`/characters/${slug}`)
  return Response.json({ data: { post } }, { status: 201 })
}
