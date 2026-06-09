import { notFound } from 'next/navigation'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchEditionBySlug } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { ReleaseReader } from '@/components/release-reader'

export default async function ChapterPublicPage({
  params,
}: {
  params: Promise<{ slug: string; editionSlug: string; chapterIndex: string }>
}) {
  const { slug, editionSlug, chapterIndex: ciStr } = await params
  const chapterNumber = parseInt(ciStr, 10)
  const chapterIndex = chapterNumber - 1

  const release = await fetchReleaseBySlug(slug)
  if (!release || release.status !== 'published') notFound()

  const edition = await fetchEditionBySlug(editionSlug)
  if (!edition || edition.release_id !== release.id || edition.status !== 'published') notFound()

  const chapters = await fetchPublishedChaptersByEdition(edition.id)

  if (chapterIndex < 0 || chapterIndex >= chapters.length) notFound()

  return <ReleaseReader release={release} edition={edition} chapters={chapters} chapterIndex={chapterIndex} />
}