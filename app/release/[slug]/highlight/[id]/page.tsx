import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchReleaseBySlug } from '@/lib/server/releases'
import { fetchChapterById } from '@/lib/server/chapters'
import { fetchChapterHighlightById } from '@/lib/server/chapter-highlights'
import { getCurrentUserFromCookie } from '@/lib/server/users'
import { getPrimaryEdition } from '@/lib/utils/editions'
import { ReleaseBookReader } from '@/components/release-book-reader'
import { fetchEditionsByRelease } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'
import { fetchChapterHighlights } from '@/lib/server/chapter-highlights'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

interface PageProps {
  params: Promise<{ slug: string; id: string }>
}

async function loadHighlightContext(slug: string, highlightId: string) {
  const release = await fetchReleaseBySlug(slug)
  if (!release || release.status !== 'published') return null

  const highlight = await fetchChapterHighlightById(highlightId, null)
  if (!highlight || !highlight.is_public) return null

  const chapter = await fetchChapterById(highlight.chapter_id)
  if (!chapter) return null

  return { release, highlight, chapter }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params
  const ctx = await loadHighlightContext(slug, id)
  if (!ctx) return { title: 'Цитата не найдена | canfly' }

  const { release, highlight } = ctx
  const title = `«${highlight.text_content.slice(0, 60)}${highlight.text_content.length > 60 ? '…' : ''}» — ${release.title}`
  const description = `Цитата из «${release.title}»${highlight.user_name ? `, автор: ${highlight.user_name}` : ''}`
  const url = `${BASE_URL}/release/${release.slug}/highlight/${highlight.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      locale: 'ru_RU',
      siteName: 'canfly',
      ...(release.cover_image && { images: [{ url: release.cover_image, width: 600, height: 900, alt: release.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(release.cover_image && { images: [release.cover_image] }),
    },
    alternates: { canonical: url },
  }
}

export default async function HighlightSharePage({ params }: PageProps) {
  const { slug, id } = await params
  const ctx = await loadHighlightContext(slug, id)
  if (!ctx) notFound()

  const { release, highlight, chapter } = ctx
  const user = await getCurrentUserFromCookie()
  const editions = await fetchEditionsByRelease(release.id)
  const primaryEdition = getPrimaryEdition(editions)

  // Загружаем ВСЕ главы издания (для навигации в читалке)
  let chapters = primaryEdition
    ? await fetchPublishedChaptersByEdition(primaryEdition.id)
    : [chapter]

  // Загружаем highlights ВСЕХ глав
  const allHighlights = user
    ? await fetchChapterHighlights({ chapterId: chapters[0]?.id, currentUserId: user.id })
    : []

  // Если текущая глава не в списке — добавляем
  if (!chapters.find(c => c.id === chapter.id)) {
    chapters = [...chapters, chapter]
  }

  // Определяем индекс нужной главы
  const startIndex = Math.max(0, chapters.findIndex(c => c.id === chapter.id))

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-cf-bg border-b border-cf-text-1/12">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <Link href={`/release/${release.slug}`} className="text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 hover:text-cf-text-heading">
            ← {release.title}
          </Link>
          <span className="text-xs text-cf-text-3">Цитата из главы «{chapter.title}»</span>
        </div>
      </div>
      <div className="pt-12">
        {primaryEdition ? (
          <ReleaseBookReader
            release={release}
            edition={primaryEdition}
            chapters={chapters}
            currentUserId={user?.id ?? null}
            initialHighlights={allHighlights}
          />
        ) : (
          <div className="p-8 text-center text-cf-text-3">Издание недоступно</div>
        )}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `setTimeout(() => { const m = document.querySelector('mark[data-cf-hl="${highlight.id}"]'); if (m) { m.scrollIntoView({behavior:'smooth', block:'center'}); m.style.outline = '2px solid #d52525'; m.style.outlineOffset = '2px'; } }, 600);`,
        }}
      />
    </>
  )
}
