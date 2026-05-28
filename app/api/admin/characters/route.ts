import { requireAdminSession } from '@/lib/admin-session'
import { createCharacter, fetchCharactersList } from '@/lib/server/characters'
import { Character } from '@/lib/types'

export const dynamic = 'force-dynamic'

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeCharacterPayload(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''

  if (!name || !slug) {
    return { error: 'Name and slug are required' }
  }

  return {
    data: {
      name,
      slug,
      avatar: typeof body.avatar === 'string' && body.avatar.trim() ? body.avatar.trim() : null,
      bio: typeof body.bio === 'string' && body.bio.trim() ? body.bio.trim() : null,
      full_description:
        typeof body.full_description === 'string' && body.full_description.trim()
          ? body.full_description.trim()
          : null,
      abilities: normalizeStringArray(body.abilities),
      speaking_style:
        typeof body.speaking_style === 'string' && body.speaking_style.trim()
          ? body.speaking_style.trim()
          : null,
      personality:
        typeof body.personality === 'string' && body.personality.trim()
          ? body.personality.trim()
          : null,
      boundaries:
        typeof body.boundaries === 'string' && body.boundaries.trim()
          ? body.boundaries.trim()
          : null,
      knowledge_scope:
        typeof body.knowledge_scope === 'string' && body.knowledge_scope.trim()
          ? body.knowledge_scope.trim()
          : null,
      spoiler_policy:
        typeof body.spoiler_policy === 'string' && body.spoiler_policy.trim()
          ? body.spoiler_policy.trim()
          : null,
      reply_mode:
        body.reply_mode === 'manual' || body.reply_mode === 'hybrid' || body.reply_mode === 'disabled'
          ? body.reply_mode
          : 'ai_auto',
      can_receive_messages: body.can_receive_messages !== false,
    },
  }
}

export async function GET() {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const characters = await fetchCharactersList()

    // Parse JSONB fields
    const parsedCharacters = characters.map((character) => ({
      ...character,
      abilities: (() => {
        if (!character.abilities) return []
        if (Array.isArray(character.abilities)) return character.abilities
        if (typeof character.abilities === 'string') {
          try {
            const parsed = JSON.parse(character.abilities)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        return []
      })(),
    }))

    return Response.json(parsedCharacters)
  } catch (error) {
    console.error('Error fetching admin characters:', error)
    return Response.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const normalized = normalizeCharacterPayload(body)

    if ('error' in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 })
    }

    const character = await createCharacter(normalized.data)

    // Parse JSONB fields
    const parsedCharacter = {
      ...character,
      abilities: (() => {
        if (!character.abilities) return []
        if (Array.isArray(character.abilities)) return character.abilities
        if (typeof character.abilities === 'string') {
          try {
            const parsed = JSON.parse(character.abilities)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        return []
      })(),
    }

    return Response.json(parsedCharacter, { status: 201 })
  } catch (error) {
    console.error('Error creating character:', error)
    return Response.json({ error: 'Failed to create character' }, { status: 500 })
  }
}
