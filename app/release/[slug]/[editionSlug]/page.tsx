import { notFound } from 'next/navigation'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchEditionsByRelease, fetchEditionBySlug } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { ReleaseReader } from '@/components/release-reader'

export default async function EditionPublicPage({
  params,
}: {
  params: Promise<{ slug: string; editionSlug: string }>
}) {
  const { slug, editionSlug } = await params
  const release = await fetchReleaseBySlug(slug)
  if (!release || release.status !== 'published') notFound()

  const edition = await fetchEditionBySlug(editionSlug)
  if (!edition || edition.release_id !== release.id || edition.status !== 'published') notFound()

  const chapters = await fetchPublishedChaptersByEdition(edition.id)

  if (chapters.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Содержимое ещё не опубликовано
      </div>
    )
  }

  return <ReleaseReader release={release} edition={edition} chapters={chapters} chapterIndex={0} />
}