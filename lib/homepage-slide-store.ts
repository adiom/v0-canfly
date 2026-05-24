import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

import { dbQuery, dbQueryOne } from '@/lib/db'
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
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null

  return (
    code === '42P01' ||
    message.includes('homepage_slides') ||
    message.includes('relation') ||
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
    () =>
      dbQuery<HomepageSlide>(
        'SELECT * FROM homepage_slides WHERE is_active = true ORDER BY display_order ASC',
      ),
    async () => {
      const slides = await readLocalHomepageSlides()
      return slides.filter((slide) => slide.is_active)
    },
  )
}

export async function listAdminHomepageSlides() {
  return withLocalSlidesFallback(
    () => dbQuery<HomepageSlide>('SELECT * FROM homepage_slides ORDER BY display_order ASC'),
    readLocalHomepageSlides,
  )
}

export async function getAdminHomepageSlide(id: string) {
  return withLocalSlidesFallback(
    () => dbQueryOne<HomepageSlide>('SELECT * FROM homepage_slides WHERE id = $1 LIMIT 1', [id]),
    async () => {
      const localSlides = await readLocalHomepageSlides()
      return localSlides.find((slide) => slide.id === id) ?? null
    },
  )
}

export async function createAdminHomepageSlide(data: SlideData) {
  return withLocalSlidesFallback(
    () =>
      dbQueryOne<HomepageSlide>(
        `
          INSERT INTO homepage_slides (
            title,
            eyebrow,
            description,
            background_image,
            mobile_image,
            primary_cta_label,
            primary_cta_href,
            secondary_cta_label,
            secondary_cta_href,
            aside_label,
            aside_number,
            aside_text,
            theme,
            is_active,
            display_order
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13::homepage_slide_theme,
            $14,
            $15
          )
          RETURNING *
        `,
        [
          data.title,
          data.eyebrow,
          data.description,
          data.background_image,
          data.mobile_image,
          data.primary_cta_label,
          data.primary_cta_href,
          data.secondary_cta_label,
          data.secondary_cta_href,
          data.aside_label,
          data.aside_number,
          data.aside_text,
          data.theme,
          data.is_active,
          data.display_order,
        ],
      ),
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
      return slide
    },
  )
}

export async function updateAdminHomepageSlide(id: string, data: SlideData) {
  return withLocalSlidesFallback(
    () =>
      dbQueryOne<HomepageSlide>(
        `
          UPDATE homepage_slides
          SET
            title = $2,
            eyebrow = $3,
            description = $4,
            background_image = $5,
            mobile_image = $6,
            primary_cta_label = $7,
            primary_cta_href = $8,
            secondary_cta_label = $9,
            secondary_cta_href = $10,
            aside_label = $11,
            aside_number = $12,
            aside_text = $13,
            theme = $14::homepage_slide_theme,
            is_active = $15,
            display_order = $16
          WHERE id = $1
          RETURNING *
        `,
        [
          id,
          data.title,
          data.eyebrow,
          data.description,
          data.background_image,
          data.mobile_image,
          data.primary_cta_label,
          data.primary_cta_href,
          data.secondary_cta_label,
          data.secondary_cta_href,
          data.aside_label,
          data.aside_number,
          data.aside_text,
          data.theme,
          data.is_active,
          data.display_order,
        ],
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
      return updatedSlide
    },
  )
}

export async function deleteAdminHomepageSlide(id: string) {
  await withLocalSlidesFallback(
    async () => {
      await dbQuery('DELETE FROM homepage_slides WHERE id = $1', [id])
    },
    async () => {
      const localSlides = await readLocalHomepageSlides()
      await writeLocalHomepageSlides(localSlides.filter((slide) => slide.id !== id))
    },
  )

  return true
}
