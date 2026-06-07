import { NextRequest, NextResponse } from 'next/server'
import { fetchCharacterBySlug } from '@/lib/server/characters'
import { Character, CharacterRelationship } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

async function getCharacterBySlug(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params as { slug: string }

  const result = await fetchCharacterBySlug(slug)

  if (!result) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const parsedCharacter = {
    ...result.character,
    abilities: (() => {
      if (!result.character.abilities) return []
      if (Array.isArray(result.character.abilities)) return result.character.abilities
      if (typeof result.character.abilities === 'string') {
        try {
          const parsed = JSON.parse(result.character.abilities)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    })(),
  }

  return NextResponse.json({
    character: parsedCharacter as Character,
    relationships: result.relationships as CharacterRelationship[],
  })
}

export const GET = apiHandler(getCharacterBySlug)