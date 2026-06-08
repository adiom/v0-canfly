import { NextRequest, NextResponse } from 'next/server'
import { requireStudioAdminSession } from '@/lib/server/studio-auth'
import {
  deleteCharacter,
  fetchCharacterById,
  updateCharacter,
} from '@/lib/server/characters'
import { apiHandler } from '@/lib/api-handler'
import { normalizeCharacterPayload, parseAbilities } from '@/lib/api/normalizers'

export const dynamic = 'force-dynamic'

async function getAdminCharacter(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const character = await fetchCharacterById(id)

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const parsedCharacter = {
    ...character,
    abilities: parseAbilities(character.abilities),
  }

  return NextResponse.json(parsedCharacter)
}

async function updateAdminCharacter(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }
  const body = await request.json()
  const normalized = normalizeCharacterPayload(body)

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 })
  }

  const character = await updateCharacter(id, normalized.data)

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const responseCharacter = {
    ...character,
    abilities: parseAbilities(character.abilities),
  }

  return NextResponse.json(responseCharacter)
}

async function deleteAdminCharacter(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const session = await requireStudioAdminSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params as { id: string }

  await deleteCharacter(id)

  return NextResponse.json({ ok: true })
}

export const GET = apiHandler(getAdminCharacter)
export const PATCH = apiHandler(updateAdminCharacter)
export const DELETE = apiHandler(deleteAdminCharacter)