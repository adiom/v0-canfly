import { NextRequest, NextResponse } from 'next/server'
import { fetchCharacterBySlug } from '@/lib/server/characters'
import {
  deleteCharacterFriendship,
  getFriendship,
  upsertCharacterFriendship,
} from '@/lib/server/users'
import { getCurrentUser } from '@/lib/server/session'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

async function getCharacterFriendship(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const data = await fetchCharacterBySlug(slug)

  if (!data?.character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const friendship = await getFriendship(user.id, data.character.id)

  return NextResponse.json({ data: { user, friendship } })
}

async function createCharacterFriendship(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const data = await fetchCharacterBySlug(slug)

  if (!data?.character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const friendship = await upsertCharacterFriendship(user.id, data.character.id)

  return NextResponse.json({ data: { user, friendship } }, { status: 201 })
}

async function removeCharacterFriendship(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const data = await fetchCharacterBySlug(slug)

  if (!data?.character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteCharacterFriendship(user.id, data.character.id)

  return NextResponse.json({ data: { user, character: data.character } })
}

export const GET = apiHandler(getCharacterFriendship)
export const POST = apiHandler(createCharacterFriendship)
export const DELETE = apiHandler(removeCharacterFriendship)