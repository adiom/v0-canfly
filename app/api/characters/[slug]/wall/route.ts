import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { fetchCharacterBySlug } from '@/lib/server/characters'
import {
  createWallPost,
  fetchWallPosts,
} from '@/lib/server/character-wall'
import { getCurrentUser } from '@/lib/server/session'
import { formatZodError, wallPostSchema } from '@/lib/schemas/character-post'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

async function getCharacterWall(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const data = await fetchCharacterBySlug(slug)
  if (!data?.character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const posts = await fetchWallPosts(data.character.id, {
    includeHidden: false,
    limit: 50,
  })

  return NextResponse.json({ data: { posts } })
}

async function createCharacterWallPost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const data = await fetchCharacterBySlug(slug)
  if (!data?.character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Необходимо войти' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = wallPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 },
    )
  }

  const post = await createWallPost(data.character.id, user.id, parsed.data.content)
  revalidatePath(`/characters/${slug}`)
  return NextResponse.json({ data: { post } }, { status: 201 })
}

export const GET = apiHandler(getCharacterWall)
export const POST = apiHandler(createCharacterWallPost)