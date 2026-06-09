'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Release, EditionFormat } from '@/lib/releases-types'
import { ReleaseCardBookmate } from '@/components/release-card-bookmate'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type ReleaseWithFormats = Release & { formats: EditionFormat[] }

const CATEGORY_PILLS: { label: string; value: EditionFormat | 'all' }[] = [
  { label: 'Всё', value: 'all' },
  { label: 'Комиксы', value: 'comic' },
  { label: 'Книги', value: 'book' },
  { label: 'Аудиокниги', value: 'audiobook' },
  { label: 'Журналы', value: 'magazine' },
  { label: 'Альбомы', value: 'album' },
]

function ShelfSection({
  title,
  linkHref,
  releases,
  priority = false,
}: {
  title: string
  linkHref: string
  releases: ReleaseWithFormats[]
  priority?: boolean
}) {
  if (releases.length === 0) return null

  return (
    <section className="py-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#302119]">
          <Link href={linkHref} className="hover:underline">
            {title}
          </Link>
        </h2>
        <Link
          href={linkHref}
          className="text-sm font-bold text-[#3456f3] hover:underline"
        >
          Все
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
        {releases.map((r) => (
          <ReleaseCardBookmate key={r.id} release={r} priority={priority} />
        ))}
      </div>
    </section>
  )
}

interface ReleasesPageBookmateProps {
  releases: ReleaseWithFormats[]
}

export function ReleasesPageBookmate({ releases }: ReleasesPageBookmateProps) {
  const [activeCategory, setActiveCategory] = useState<EditionFormat | 'all'>('all')

  const newest = [...releases].sort(
    (a, b) =>
      new Date(b.release_date ?? b.created_at).getTime() -
      new Date(a.release_date ?? a.created_at).getTime(),
  )

  const popular = [...releases].sort((a, b) => b.view_count - a.view_count)

  const comics = releases.filter((r) => r.formats.includes('comic'))
  const books = releases.filter((r) => r.formats.includes('book'))
  const audio = releases.filter((r) =>
    r.formats.some((f) => f === 'audiobook' || f === 'audiorelease'),
  )

  const filtered =
    activeCategory === 'all'
      ? releases
      : activeCategory === 'audiobook'
        ? releases.filter((r) =>
            r.formats.some((f) => f === 'audiobook' || f === 'audiorelease'),
          )
        : releases.filter((r) => r.formats.includes(activeCategory as EditionFormat))

  return (
    <main className="min-h-screen bg-[#f4f2ef] text-[#302119]">
      <SiteHeader activePath="/releases" />

      <div className="mx-auto max-w-[992px] px-4">
        <h1 className="text-2xl font-bold text-[#302119] pt-6 pb-4">
          Релизы
        </h1>

        <nav className="flex flex-wrap gap-2 pb-6 border-b border-[#302119]/10">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setActiveCategory(pill.value)}
              className={`h-9 px-4 text-sm font-bold rounded-full transition-colors ${
                activeCategory === pill.value
                  ? 'bg-[#3456f3] text-white'
                  : 'bg-[#ebe5d9] text-[#302119] hover:bg-[#d7c6ad]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </nav>

        {activeCategory === 'all' && (
          <>
            <ShelfSection
              title="Новинки"
              linkHref="/releases?ab=bookmate&sort=new"
              releases={newest.slice(0, 20)}
              priority
            />
            <ShelfSection
              title="Популярное"
              linkHref="/releases?ab=bookmate&sort=popular"
              releases={popular.slice(0, 20)}
            />
            {comics.length > 0 && (
              <ShelfSection
                title="Комиксы"
                linkHref="/releases?ab=bookmate&cat=comic"
                releases={comics}
              />
            )}
            {books.length > 0 && (
              <ShelfSection
                title="Книги"
                linkHref="/releases?ab=bookmate&cat=book"
                releases={books}
              />
            )}
            {audio.length > 0 && (
              <ShelfSection
                title="Аудиокниги"
                linkHref="/releases?ab=bookmate&cat=audiobook"
                releases={audio}
              />
            )}
          </>
        )}

        {filtered.length > 0 ? (
          <section className="py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
              {filtered.map((r) => (
                <ReleaseCardBookmate key={r.id} release={r} />
              ))}
            </div>
          </section>
        ) : (
          <div className="py-16 text-center text-sm text-[#8a7e74]">
            Ничего не найдено
          </div>
        )}
      </div>

      <SiteFooter variant="simple" />
    </main>
  )
}