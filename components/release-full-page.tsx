'use client'

import Link from 'next/link'
import { sanitizeChapterHtml } from '@/lib/sanitize'
import type { Release, Edition, Chapter, ReleaseDesignConfig } from '@/lib/releases-types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'

const defaultConfig: ReleaseDesignConfig = {
  accent_color: '#d52525',
  bg_color: '#111210',
  text_color: '#f4efe5',
  layout: 'narrow',
  show_toc: true,
}

export function ReleaseFullPage({ release, edition, chapters }: {
  release: Release
  edition: Edition
  chapters: Chapter[]
}) {
  const config = release.design_config ?? {}
  const accent = config.accent_color ?? defaultConfig.accent_color!
  const bg = config.bg_color ?? defaultConfig.bg_color!
  const text = config.text_color ?? defaultConfig.text_color!
  const layout = config.layout ?? defaultConfig.layout!

  const maxWidth = layout === 'wide' ? 'max-w-4xl' : 'max-w-2xl'

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: text }}>
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: `${text}15`, backgroundColor: bg }}>
        <div className={`mx-auto flex items-center gap-3 px-6 py-3 ${maxWidth}`}>
          <Link href={`/release/${release.slug}`}>
            <Button variant="ghost" size="icon" style={{ color: text }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: accent }}>{release.title}</p>
            <p className="text-xs opacity-60 truncate">Полная версия</p>
          </div>
          {chapters.length > 1 && (
            <Link href={`/release/${release.slug}/${edition.slug}/0`}>
              <Button variant="ghost" size="icon" style={{ color: text }}>
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className={`mx-auto px-6 py-8 ${maxWidth}`}>
        <h1 className="text-3xl font-black uppercase mb-8" style={{ color: accent }}>{release.title}</h1>
        {release.annotation && (
          <div className="mb-12 leading-7 opacity-70">{release.annotation}</div>
        )}

        {chapters.map((chapter, index) => (
          <section key={chapter.id} id={`chapter-${index + 1}`} className="mb-16">
            {chapters.length > 1 && (
              <h2 className="text-xl font-bold mb-6 pb-3" style={{ borderColor: `${accent}30`, borderBottom: `1px solid ${accent}30` }}>
                {chapter.title}
              </h2>
            )}
            {chapter.content ? (
              <div
                className="prose prose-lg max-w-none leading-7"
                dangerouslySetInnerHTML={{ __html: sanitizeChapterHtml(chapter.content) }}
              />
            ) : (
              <div className="text-center opacity-40 py-8">Содержимое ещё не добавлено</div>
            )}
          </section>
        ))}
      </div>

      <footer className="border-t py-6" style={{ borderColor: `${text}10` }}>
        <div className={`mx-auto px-6 ${maxWidth} flex items-center justify-between text-sm opacity-50`}>
          <span>canfly</span>
          <Link href={`/release/${release.slug}/${edition.slug}/0`} style={{ color: accent }}>
            Постраничный режим
          </Link>
        </div>
      </footer>
    </div>
  )
}