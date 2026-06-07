import { NextRequest, NextResponse } from 'next/server'
import { fetchCharacterBySlug } from '@/lib/server/characters'
import {
  ensureReaderUser,
  fetchConversationMessages,
  getOrCreateCharacterConversation,
  upsertCharacterFriendship,
} from '@/lib/server/users'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

async function getCharacterConversation(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }
  const data = await fetchCharacterBySlug(slug)

  if (!data?.character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const user = await ensureReaderUser()
  const friendship = await upsertCharacterFriendship(user.id, data.character.id)
  const conversation = await getOrCreateCharacterConversation(user.id, data.character.id)

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 500 })
  }

  const messages = await fetchConversationMessages(conversation.id)

  return NextResponse.json({
    data: {
      user,
      friendship,
      conversation,
      messages,
    },
  })
}

export const GET = apiHandler(getCharacterConversation)