import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchEditionBySlug } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { fetchChapterHighlights } from '@/lib/server/chapter-highlights'
import type { UserRole } from '@/lib/types'
import { ReleaseBookReader } from '@/components/release-book-reader'
import { ReleaseComicReader } from '@/components/release-comic-reader'
import { ReleaseAudioPlayer } from '@/components/release-audio-player'

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

  // Redirect book editions to the new SEO-friendly URL structure
  if (edition.format === 'book') {
    redirect(`/release/${slug}/book/${edition.quality_tier}/${chapterNumber}`)
  }

  const chapters = await fetchPublishedChaptersByEdition(edition.id)
  if (chapterIndex < 0 || chapterIndex >= chapters.length) notFound()

  if (edition.format === 'magazine') {
    const user = await getCurrentUser()
    const roles: UserRole[] = user ? await getUserRoles(user.id) : []
    const userRole = roles.find(r => ['editor', 'admin', 'author'].includes(r)) ?? (roles[0] ?? null)
    const highlights = await fetchChapterHighlights({
      chapterId: chapters[chapterIndex].id,
      currentUserId: user?.id ?? null,
    })
    return (
      <ReleaseBookReader
        release={release}
        edition={edition}
        chapters={chapters}
        initialChapterIndex={chapterIndex}
        currentUserId={user?.id ?? null}
        initialHighlights={highlights}
        userRole={userRole}
        userName={user?.display_name ?? null}
      />
    )
  }

  if (edition.format === 'comic') {
    return <ReleaseComicReader release={release} edition={edition} chapters={chapters} />
  }

  // audiobook | audiorelease | album
  return <ReleaseAudioPlayer release={release} edition={edition} chapters={chapters} initialChapterIndex={chapterIndex} />
}
