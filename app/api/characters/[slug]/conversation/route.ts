import { fetchCharacterBySlug } from '@/lib/server/characters'
import {
  ensureReaderUser,
  fetchConversationMessages,
  getOrCreateCharacterConversation,
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
    const friendship = await upsertCharacterFriendship(user.id, data.character.id)
    const conversation = await getOrCreateCharacterConversation(user.id, data.character.id)

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 500 })
    }

    const messages = await fetchConversationMessages(conversation.id)

    return Response.json({
      data: {
        user,
        friendship,
        conversation,
        messages,
      },
    })
  } catch (error) {
    console.error('Error loading character conversation:', error)
    return Response.json({ error: 'Failed to load conversation' }, { status: 500 })
  }
}
