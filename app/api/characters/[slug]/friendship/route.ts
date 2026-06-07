import { fetchCharacterBySlug } from '@/lib/server/characters'
import {
  deleteCharacterFriendship,
  ensureReaderUser,
  getFriendship,
  upsertCharacterFriendship,
} from '@/lib/server/users'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const data = await fetchCharacterBySlug(slug)

    if (!data?.character) {
      return Response.json({ error: 'Character not found' }, { status: 404 })
    }

    const user = await ensureReaderUser()
    const friendship = await getFriendship(user.id, data.character.id)

    return Response.json({ data: { user, friendship } })
  } catch (error) {
    console.error('Error loading character friendship:', error)
    return Response.json({ error: 'Failed to load friendship' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const data = await fetchCharacterBySlug(slug)

    if (!data?.character) {
      return Response.json({ error: 'Character not found' }, { status: 404 })
    }

    const user = await ensureReaderUser()
    const friendship = await upsertCharacterFriendship(user.id, data.character.id)

    return Response.json({ data: { user, friendship } }, { status: 201 })
  } catch (error) {
    console.error('Error creating character friendship:', error)
    return Response.json({ error: 'Failed to add friend' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const data = await fetchCharacterBySlug(slug)

    if (!data?.character) {
      return Response.json({ error: 'Character not found' }, { status: 404 })
    }

    const user = await ensureReaderUser()
    await deleteCharacterFriendship(user.id, data.character.id)

    return Response.json({ data: { user, character: data.character } })
  } catch (error) {
    console.error('Error removing character friendship:', error)
    return Response.json({ error: 'Failed to remove friend' }, { status: 500 })
  }
}
