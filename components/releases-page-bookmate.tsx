'use client'

import { useState } from 'react'
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

interface ReleasesPageBookmateProps {
  releases: ReleaseWithFormats[]
}

export function ReleasesPageBookmate({ releases }: ReleasesPageBookmateProps) {
  const [activeCategory, setActiveCategory] = useState<EditionFormat | 'all'>('all')

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
