import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchEditionBySlug } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { fetchChapterHighlights } from '@/lib/server/chapter-highlights'
import type { UserRole } from '@/lib/types'
import { ReleaseBookReader } from '@/components/release-book-reader'
import { ReleaseComicReader } from '@/components/release-comic-reader'
import { ReleaseAudioPlayer } from '@/components/release-audio-player'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

const formatLabels: Record<string, string> = {
  comic: 'Комикс',
  magazine: 'Журнал',
  audiobook: 'Аудиокнига',
  audiorelease: 'Аудиорелиз',
  album: 'Альбом',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; editionSlug: string; chapterIndex: string }>
}): Promise<Metadata> {
  const { slug, editionSlug, chapterIndex: ciStr } = await params
  const chapterNumber = parseInt(ciStr, 10)

  const release = await fetchReleaseBySlug(slug)
  if (!release) return { title: 'Не найдено | canfly' }

  const edition = await fetchEditionBySlug(editionSlug)
  if (!edition || edition.release_id !== release.id || edition.status !== 'published') {
    return { title: 'Не найдено | canfly' }
  }

  if (edition.format === 'book') {
    return { title: 'Перенаправление...' }
  }

  const formatLabel = formatLabels[edition.format] ?? edition.format
  const title = `Глава ${chapterNumber} — ${release.title} (${formatLabel}) | canfly`
  const description = release.annotation ?? release.description ?? `«${release.title}» на canfly`
  const url = `${BASE_URL}/release/${release.slug}/${editionSlug}/${chapterNumber}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'book',
      locale: 'ru_RU',
      siteName: 'canfly',
      ...(release.cover_image && { images: [{ url: release.cover_image, width: 600, height: 900, alt: release.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
    },
    alternates: { canonical: url },
  }
}

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
