import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdminRequest } from '@/lib/supabase/admin-rest'
import { HomepageSlide } from '@/lib/types'

type SlideData = Omit<HomepageSlide, 'id' | 'created_at' | 'updated_at'>

const localSlidesPath = path.join(process.cwd(), 'data', 'homepage-slides.json')
const isLocalFallbackEnabled = process.env.NODE_ENV !== 'production'

const defaultHomepageSlides: HomepageSlide[] = [
  {
    id: 'local-slide-atelier',
    title: 'Крой по душе',
    eyebrow: 'бытовой магический реализм',
    description:
      'Швея Соня создаёт одежду, которая работает как эмоциональная броня: ткань говорит за человека, когда голос не выдерживает.',
    background_image: null,
    mobile_image: null,
    primary_cta_label: 'Читать',
    primary_cta_href: '/books',
    secondary_cta_label: 'Персонажи',
    secondary_cta_href: '/characters',
    aside_label: null,
    aside_number: null,
    aside_text: null,
    theme: 'atelier',
    is_active: true,
    display_order: 1,
    created_at: '2026-05-16T00:00:00.000Z',
    updated_at: '2026-05-16T00:00:00.000Z',
  },
  {
    id: 'local-slide-night-city',
    title: 'Маша Можно',
    eyebrow: 'ночной город / ненадёжная память',
    description:
      'Остановки, автобусы, странные разговоры и мягкий хоррор повседневности, где невозможно до конца доверять собственному восприятию.',
    background_image: null,
    mobile_image: null,
    primary_cta_label: 'Войти в историю',
    primary_cta_href: '/books',
    secondary_cta_label: 'Город N',
    secondary_cta_href: '/characters',
    aside_label: null,
    aside_number: null,
    aside_text: null,
    theme: 'night-city',
    is_active: true,
    display_order: 2,
    created_at: '2026-05-16T00:00:00.000Z',
    updated_at: '2026-05-16T00:00:00.000Z',
  },
  {
    id: 'local-slide-pvz',
    title: 'Неучтённая',
    eyebrow: 'производственное технофэнтези',
    description:
      'Сотрудница ПВЗ попадает в мир, где реальность устроена как повреждённая система хранения: маршруты, ячейки, узлы и архивы.',
    background_image: null,
    mobile_image: null,
    primary_cta_label: 'Открыть цикл',
    primary_cta_href: '/books',
    secondary_cta_label: 'Смотреть миры',
    secondary_cta_href: '/characters',
    aside_label: null,
    aside_number: null,
    aside_text: null,
    theme: 'pvz',
    is_active: true,
    display_order: 3,
    created_at: '2026-05-16T00:00:00.000Z',
    updated_at: '2026-05-16T00:00:00.000Z',
  },
  {
    id: 'local-slide-volga',
    title: 'Железный Хан Волги',
    eyebrow: 'инженерное попаданчество',
    description:
      'Инженер XXI века в XVI столетии собирает не легенду о себе, а инфраструктуру, правила и систему, которая переживёт человека.',
    background_image: null,
    mobile_image: null,
    primary_cta_label: 'Читать роман',
    primary_cta_href: '/books',
    secondary_cta_label: 'Карта связей',
    secondary_cta_href: '/characters',
    aside_label: null,
    aside_number: null,
    aside_text: null,
    theme: 'volga',
    is_active: true,
    display_order: 4,
    created_at: '2026-05-16T00:00:00.000Z',
    updated_at: '2026-05-16T00:00:00.000Z',
  },
]

export function isHomepageSlidesTableMissing(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes('homepage_slides') ||
    message.includes('Could not find the table') ||
    message.includes('schema cache') ||
    message.includes('PGRST205')
  )
}

function sortSlides(slides: HomepageSlide[]) {
  return [...slides].sort((a, b) => a.display_order - b.display_order)
}

async function writeLocalHomepageSlides(slides: HomepageSlide[]) {
  await mkdir(path.dirname(localSlidesPath), { recursive: true })
  await writeFile(localSlidesPath, `${JSON.stringify(sortSlides(slides), null, 2)}\n`, 'utf8')
}

async function readLocalHomepageSlides() {
  try {
    const content = await readFile(localSlidesPath, 'utf8')
    return sortSlides(JSON.parse(content) as HomepageSlide[])
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null

    if (code !== 'ENOENT') {
      throw error
    }

    await writeLocalHomepageSlides(defaultHomepageSlides)
    return defaultHomepageSlides
  }
}

async function withLocalSlidesFallback<T>(operation: () => Promise<T>, fallback: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (isLocalFallbackEnabled && isHomepageSlidesTableMissing(error)) {
      return fallback()
    }

    throw error
  }
}

export async function getPublicHomepageSlides() {
  return withLocalSlidesFallback(
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('homepage_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to load homepage slides: ${error.message}`)
      }

      return (data || []) as HomepageSlide[]
    },
    async () => {
      const slides = await readLocalHomepageSlides()
      return slides.filter((slide) => slide.is_active)
    },
  )
}

export async function listAdminHomepageSlides() {
  return withLocalSlidesFallback(
    () =>
      supabaseAdminRequest<HomepageSlide[]>(
        '/rest/v1/homepage_slides?select=*&order=display_order.asc',
      ),
    readLocalHomepageSlides,
  )
}

export async function getAdminHomepageSlide(id: string) {
  const searchParams = new URLSearchParams({
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  })
  const slides = await withLocalSlidesFallback(
    () =>
      supabaseAdminRequest<HomepageSlide[]>(
        `/rest/v1/homepage_slides?${searchParams.toString()}`,
      ),
    async () => {
      const localSlides = await readLocalHomepageSlides()
      return localSlides.filter((slide) => slide.id === id)
    },
  )

  return slides[0] || null
}

export async function createAdminHomepageSlide(data: SlideData) {
  const slides = await withLocalSlidesFallback(
    () =>
      supabaseAdminRequest<HomepageSlide[]>('/rest/v1/homepage_slides?select=*', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      }),
    async () => {
      const now = new Date().toISOString()
      const slide: HomepageSlide = {
        ...data,
        id: randomUUID(),
        created_at: now,
        updated_at: now,
      }
      const localSlides = await readLocalHomepageSlides()

      await writeLocalHomepageSlides([...localSlides, slide])
      return [slide]
    },
  )

  return slides[0] || null
}

export async function updateAdminHomepageSlide(id: string, data: SlideData) {
  const slides = await withLocalSlidesFallback(
    () =>
      supabaseAdminRequest<HomepageSlide[]>(
        `/rest/v1/homepage_slides?id=eq.${encodeURIComponent(id)}&select=*`,
        {
          method: 'PATCH',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify(data),
        },
      ),
    async () => {
      const localSlides = await readLocalHomepageSlides()
      const existingSlide = localSlides.find((slide) => slide.id === id)

      if (!existingSlide) {
        return []
      }

      const updatedSlide: HomepageSlide = {
        ...existingSlide,
        ...data,
        updated_at: new Date().toISOString(),
      }

      await writeLocalHomepageSlides(
        localSlides.map((slide) => (slide.id === id ? updatedSlide : slide)),
      )
      return [updatedSlide]
    },
  )

  return slides[0] || null
}

export async function deleteAdminHomepageSlide(id: string) {
  await withLocalSlidesFallback(
    () =>
      supabaseAdminRequest(`/rest/v1/homepage_slides?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      }),
    async () => {
      const localSlides = await readLocalHomepageSlides()
      await writeLocalHomepageSlides(localSlides.filter((slide) => slide.id !== id))
    },
  )

  return true
}
