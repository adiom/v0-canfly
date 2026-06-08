import { NextRequest, NextResponse } from 'next/server'
import { requireStudioAdminSession } from '@/lib/server/studio-auth'
import {
  deleteAdminHomepageSlide,
  getAdminHomepageSlide,
  isHomepageSlidesTableMissing,
  updateAdminHomepageSlide,
} from '@/lib/homepage-slide-store'
import { apiHandler } from '@/lib/api-handler'
import { normalizeSlidePayload } from '@/lib/api/normalizers'

export const dynamic = 'force-dynamic'

async function getHomepageSlideById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  try {
    const session = await requireStudioAdminSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params as { id: string }
    const slide = await getAdminHomepageSlide(id)

    if (!slide) {
      return NextResponse.json({ error: 'Homepage slide not found' }, { status: 404 })
    }

    return NextResponse.json(slide)
  } catch (error) {
    if (isHomepageSlidesTableMissing(error)) {
      return NextResponse.json(
        {
          error:
            'Таблица homepage_slides не создана. Выполните SQL из postgres/schema.sql в Postgres.',
        },
        { status: 424 },
      )
    }

    throw error
  }
}

async function patchHomepageSlideById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  try {
    const session = await requireStudioAdminSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params as { id: string }
    const body = await request.json()
    const normalized = normalizeSlidePayload(body)

    if ('error' in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    const slide = await updateAdminHomepageSlide(id, normalized.data)

    if (!slide) {
      return NextResponse.json({ error: 'Homepage slide not found' }, { status: 404 })
    }

    return NextResponse.json(slide)
  } catch (error) {
    if (isHomepageSlidesTableMissing(error)) {
      return NextResponse.json(
        {
          error:
            'Таблица homepage_slides не создана. Выполните SQL из postgres/schema.sql в Postgres.',
        },
        { status: 424 },
      )
    }

    throw error
  }
}

async function deleteHomepageSlideById(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  try {
    const session = await requireStudioAdminSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params as { id: string }

    await deleteAdminHomepageSlide(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isHomepageSlidesTableMissing(error)) {
      return NextResponse.json(
        {
          error:
            'Таблица homepage_slides не создана. Выполните SQL из postgres/schema.sql в Postgres.',
        },
        { status: 424 },
      )
    }

    throw error
  }
}

export const GET = apiHandler(getHomepageSlideById)
export const PATCH = apiHandler(patchHomepageSlideById)
export const DELETE = apiHandler(deleteHomepageSlideById)