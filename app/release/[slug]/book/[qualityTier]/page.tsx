import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchEditionByReleaseFormatTier } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'

export default async function EditionPublicPage({
  params,
}: {
  params: Promise<{ slug: string; qualityTier: string }>
}) {
  const { slug, qualityTier } = await params
  const release = await fetchReleaseBySlug(slug)
  if (!release || release.status !== 'published') notFound()

  const edition = await fetchEditionByReleaseFormatTier(release.id, 'book', qualityTier)
  if (!edition || edition.status !== 'published') notFound()

  const chapters = await fetchPublishedChaptersByEdition(edition.id)

  if (chapters.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-cf-text-3">
        Содержимое ещё не опубликовано
      </div>
    )
  }

  redirect(`/release/${slug}/book/${qualityTier}/1`)
}