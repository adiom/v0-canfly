import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchEditionById } from '@/lib/server/editions'
import { fetchReleaseById } from '@/lib/server/releases'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'
import { fetchChapterHighlights } from '@/lib/server/chapter-highlights'
import { fetchReadingProgress } from '@/lib/server/reading-progress'
import { SpreadReader } from '@/components/spread-reader'
import type { UserRole } from '@/lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ editionId: string }>
}): Promise<Metadata> {
  const { editionId } = await params
  const edition = await fetchEditionById(editionId)
  if (!edition || edition.status !== 'published') return { title: 'Не найдено | canfly' }

  const release = await fetchReleaseById(edition.release_id)
  if (!release || release.status !== 'published') return { title: 'Не найдено | canfly' }

  const title = `${release.title} — читать | canfly`
  const description = release.annotation ?? release.description ?? `«${release.title}» — читать на canfly`
  const url = `${BASE_URL}/reader/${editionId}`

  return {
    title,
    description,
    robots: { index: false },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      locale: 'ru_RU',
      siteName: 'canfly',
      ...(release.cover_image && {
        images: [{ url: release.cover_image, width: 600, height: 900, alt: release.title }],
      }),
    },
    alternates: { canonical: url },
  }
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ editionId: string }>
}) {
  const { editionId } = await params

  const edition = await fetchEditionById(editionId)
  if (!edition || edition.status !== 'published') notFound()

  const release = await fetchReleaseById(edition.release_id)
  if (!release || release.status !== 'published') notFound()

  const chapters = await fetchPublishedChaptersByEdition(edition.id)
  if (chapters.length === 0) notFound()

  const user = await getCurrentUser()
  const roles = user ? await getUserRoles(user.id) : []
  const userRole: UserRole | null =
    (roles.find(r => ['editor', 'admin', 'author'].includes(r)) ?? roles[0] ?? null) as UserRole | null

  const progress = user ? await fetchReadingProgress(edition.id, user.id) : null
  const initialChapterIndex = progress
    ? Math.max(0, chapters.findIndex(c => c.id === progress.chapter_id))
    : 0

  const initialHighlights = await fetchChapterHighlights({
    chapterId: chapters[initialChapterIndex].id,
    currentUserId: user?.id ?? null,
  })

  return (
    <SpreadReader
      release={release}
      edition={edition}
      chapters={chapters}
      initialChapterIndex={initialChapterIndex}
      currentUserId={user?.id ?? null}
      initialHighlights={initialHighlights}
      userRole={userRole}
      userName={user?.display_name ?? null}
    />
  )
}
