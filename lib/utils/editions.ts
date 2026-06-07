import type { Edition, EditionFormat } from '@/lib/releases-types'

const FORMAT_PRIORITY: EditionFormat[] = [
  'book',
  'comic',
  'magazine',
  'audiobook',
  'audiorelease',
  'album',
]

export function getPrimaryEdition(editions: Edition[]): Edition | null {
  const published = editions.filter(e => e.status === 'published')
  if (published.length === 0) return null

  return (
    published.find(e => e.is_primary) ??
    published.sort(
      (a, b) => FORMAT_PRIORITY.indexOf(a.format) - FORMAT_PRIORITY.indexOf(b.format),
    )[0]
  )
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} ч ${m} мин`
  return `${m} мин`
}
