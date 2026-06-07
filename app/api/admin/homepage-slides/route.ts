import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'
import {
  createAdminHomepageSlide,
  isHomepageSlidesTableMissing,
  listAdminHomepageSlides,
} from '@/lib/homepage-slide-store'
import { HomepageSlideTheme } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

const slideThemes: HomepageSlideTheme[] = ['atelier', 'night-city', 'pvz', 'volga', 'dreams']

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeSlidePayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const displayOrder =
    typeof body.display_order === 'number' && Number.isFinite(body.display_order)
      ? body.display_order
      : 0
  const theme = slideThemes.includes(body.theme as HomepageSlideTheme)
    ? (body.theme as HomepageSlideTheme)
    : 'atelier'

  if (!title) {
    return { error: 'Title is required' }
  }

  return {
    data: {
      title,
      eyebrow: optionalString(body.eyebrow),
      description: optionalString(body.description),
      background_image: optionalString(body.background_image),
      mobile_image: optionalString(body.mobile_image),
      primary_cta_label: optionalString(body.primary_cta_label),
      primary_cta_href: optionalString(body.primary_cta_href),
      secondary_cta_label: optionalString(body.secondary_cta_label),
      secondary_cta_href: optionalString(body.secondary_cta_href),
      aside_label: optionalString(body.aside_label),
      aside_number: optionalString(body.aside_number),
      aside_text: optionalString(body.aside_text),
      theme,
      is_active: Boolean(body.is_active),
      display_order: displayOrder,
    },
  }
}

async function getAdminHomepageSlides(request: NextRequest) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slides = await listAdminHomepageSlides()

    return NextResponse.json(slides)
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

async function postHomepageSlide(request: NextRequest) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const normalized = normalizeSlidePayload(body)

    if ('error' in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    const slide = await createAdminHomepageSlide(normalized.data)

    if (!slide) {
      return NextResponse.json({ error: 'Failed to create homepage slide' }, { status: 500 })
    }

    return NextResponse.json(slide, { status: 201 })
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

export const GET = apiHandler(getAdminHomepageSlides)
export const POST = apiHandler(postHomepageSlide)