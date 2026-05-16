import { requireAdminSession } from '@/lib/admin-session'
import {
  deleteAdminHomepageSlide,
  getAdminHomepageSlide,
  isHomepageSlidesTableMissing,
  updateAdminHomepageSlide,
} from '@/lib/homepage-slide-store'
import { HomepageSlideTheme } from '@/lib/types'

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const slide = await getAdminHomepageSlide(id)

    if (!slide) {
      return Response.json({ error: 'Homepage slide not found' }, { status: 404 })
    }

    return Response.json(slide)
  } catch (error) {
    if (isHomepageSlidesTableMissing(error)) {
      return Response.json(
        {
          error:
            'Таблица homepage_slides не создана. Выполните SQL из scripts/003_homepage_slides.sql в Supabase.',
        },
        { status: 424 },
      )
    }

    console.error('Error fetching admin homepage slide:', error)
    return Response.json({ error: 'Failed to fetch homepage slide' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const normalized = normalizeSlidePayload(body)

    if ('error' in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 })
    }

    const slide = await updateAdminHomepageSlide(id, normalized.data)

    if (!slide) {
      return Response.json({ error: 'Homepage slide not found' }, { status: 404 })
    }

    return Response.json(slide)
  } catch (error) {
    if (isHomepageSlidesTableMissing(error)) {
      return Response.json(
        {
          error:
            'Таблица homepage_slides не создана. Выполните SQL из scripts/003_homepage_slides.sql в Supabase.',
        },
        { status: 424 },
      )
    }

    console.error('Error updating homepage slide:', error)
    return Response.json({ error: 'Failed to update homepage slide' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await deleteAdminHomepageSlide(id)

    return Response.json({ ok: true })
  } catch (error) {
    if (isHomepageSlidesTableMissing(error)) {
      return Response.json(
        {
          error:
            'Таблица homepage_slides не создана. Выполните SQL из scripts/003_homepage_slides.sql в Supabase.',
        },
        { status: 424 },
      )
    }

    console.error('Error deleting homepage slide:', error)
    return Response.json({ error: 'Failed to delete homepage slide' }, { status: 500 })
  }
}
