import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchReleaseBySlug, fetchReleaseCharacters, fetchReleaseSeries } from '@/lib/server/releases'
import { fetchEditionsByRelease } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { fetchSeriesById } from '@/lib/server/series'
import { fetchCharactersList } from '@/lib/server/characters'
import { getCurrentUserFromCookie } from '@/lib/server/users'
import { fetchChapterHighlights } from '@/lib/server/chapter-highlights'
import { ReleasePagePublic } from '@/components/release-page'
import { ReleaseBookReader } from '@/components/release-book-reader'
import { ReleaseComicReader } from '@/components/release-comic-reader'
import { ReleaseAudioPlayer } from '@/components/release-audio-player'
import { getPrimaryEdition } from '@/lib/utils/editions'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const release = await fetchReleaseBySlug(slug)
  if (!release) return { title: 'Не найдено | canfly' }

  const title = `${release.title} | canfly`
  const description = release.annotation ?? release.description ?? `«${release.title}» на canfly`
  const url = `${BASE_URL}/release/${release.slug}`

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

export default async function ReleasePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const release = await fetchReleaseBySlug(slug)
  if (!release || release.status !== 'published') notFound()

  const editions = await fetchEditionsByRelease(release.id)
  const primaryEdition = getPrimaryEdition(editions)

  // Если есть главное издание — загружаем главы и рендерим ридер
  if (primaryEdition) {
    const chapters = await fetchPublishedChaptersByEdition(primaryEdition.id)

    if (primaryEdition.format === 'book' || primaryEdition.format === 'magazine') {
      const user = await getCurrentUserFromCookie()
      const highlights = chapters.length > 0
        ? await fetchChapterHighlights({ chapterId: chapters[0].id, currentUserId: user?.id ?? null })
        : []
      // Для всех глав сразу (для кросс-главной навигации — но мы рендерим по одной, так что достаточно первой)
      // TODO: при смене главы подгружать highlights текущей главы
      return (
        <ReleaseBookReader
          release={release}
          edition={primaryEdition}
          chapters={chapters}
          currentUserId={user?.id ?? null}
          initialHighlights={highlights}
        />
      )
    }

    if (primaryEdition.format === 'comic') {
      return <ReleaseComicReader release={release} edition={primaryEdition} chapters={chapters} />
    }

    if (
      primaryEdition.format === 'audiobook' ||
      primaryEdition.format === 'audiorelease' ||
      primaryEdition.format === 'album'
    ) {
      return <ReleaseAudioPlayer release={release} edition={primaryEdition} chapters={chapters} />
    }
  }

  // Fallback — страница-анонс с метаданными (нет опубликованных изданий или неизвестный формат)
  const releaseChars = await fetchReleaseCharacters(release.id)
  const allCharacters = await fetchCharactersList()
  const seriesLinks = await fetchReleaseSeries(release.id)

  const characters = releaseChars
    .map(rc => {
      const ch = allCharacters.find(c => c.id === rc.character_id)
      return ch ? { id: ch.id, name: ch.name, slug: ch.slug, avatar: ch.avatar ?? null, role: rc.role } : null
    })
    .filter(Boolean) as { id: string; name: string; slug: string; avatar: string | null; role: string }[]

  const seriesLink = seriesLinks.length > 0
    ? { series: await fetchSeriesById(seriesLinks[0].series_id), phase_number: seriesLinks[0].phase_number }
    : null

  const validSeriesLink = seriesLink && seriesLink.series
    ? { series: seriesLink.series, phase_number: seriesLink.phase_number }
    : null

  return <ReleasePagePublic release={release} editions={editions} characters={characters} seriesLink={validSeriesLink} />
}
