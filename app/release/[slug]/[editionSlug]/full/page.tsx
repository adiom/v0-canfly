import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchEditionBySlug } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { ReleaseFullPage } from '@/components/release-full-page'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

export async function generateMetadata({ params }: { params: Promise<{ slug: string; editionSlug: string }> }): Promise<Metadata> {
  const { slug, editionSlug } = await params
  const release = await fetchReleaseBySlug(slug)
  if (!release) return { title: 'Не найдено | canfly' }

  const title = `${release.title} (полная версия) | canfly`
  const description = release.annotation ?? release.description ?? `«${release.title}» — полная версия на canfly`
  const url = `${BASE_URL}/release/${release.slug}/${editionSlug}/full`

  return {
    title,
    description,
    openGraph: {
      title, description, url,
      type: 'book',
      locale: 'ru_RU',
      siteName: 'canfly',
      ...(release.cover_image && { images: [{ url: release.cover_image, width: 600, height: 900, alt: release.title }] }),
    },
    alternates: { canonical: url },
  }
}

export default async function EditionFullPage({ params }: { params: Promise<{ slug: string; editionSlug: string }> }) {
  const { slug, editionSlug } = await params
  const release = await fetchReleaseBySlug(slug)
  if (!release || release.status !== 'published') notFound()

  const edition = await fetchEditionBySlug(editionSlug)
  if (!edition || edition.release_id !== release.id || edition.status !== 'published') notFound()

  const chapters = await fetchPublishedChaptersByEdition(edition.id)
  if (chapters.length === 0) notFound()

  return <ReleaseFullPage release={release} edition={edition} chapters={chapters} />
}