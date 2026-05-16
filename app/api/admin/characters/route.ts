import { requireAdminSession } from '@/lib/admin-session'
import { supabaseAdminRequest } from '@/lib/supabase/admin-rest'
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
    },
  }
}

export async function GET() {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const characters = await supabaseAdminRequest<Character[]>(
      '/rest/v1/characters?select=*&order=created_at.desc',
    )

    return Response.json(characters)
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

    const characters = await supabaseAdminRequest<Character[]>('/rest/v1/characters?select=*', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(normalized.data),
    })

    return Response.json(characters[0], { status: 201 })
  } catch (error) {
    console.error('Error creating character:', error)
    return Response.json({ error: 'Failed to create character' }, { status: 500 })
  }
}

