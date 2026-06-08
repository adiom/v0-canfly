'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Release, Edition, ReleaseDesignConfig, Series } from '@/lib/releases-types'
const defaultConfig: ReleaseDesignConfig = {
  accent_color: '#d52525',
  bg_color: '#111210',
  text_color: '#f4efe5',
  hero_style: 'full',
  hero_overlay: 'gradient',
  layout: 'narrow',
  show_toc: true,
  show_characters: true,
  show_series: true,
}

const formatLabels: Record<string, string> = {
  book: 'Книга', comic: 'Комикс', audiobook: 'Аудиокнига',
  audiorelease: 'Аудиорелиз', album: 'Альбом', magazine: 'Журнал',
}

const roleLabels: Record<string, string> = {
  main: 'Главный', supporting: 'Второстепенный', cameo: 'Камео',
}

interface ReleasePagePublicProps {
  release: Release
  editions: Edition[]
  characters: { id: string; name: string; slug: string; avatar: string | null; role: string }[]
  seriesLink: { series: Series; phase_number: number | null } | null
}

export function ReleasePagePublic({ release, editions, characters, seriesLink }: ReleasePagePublicProps) {
  const config = release.design_config ?? {}
  const accent = config.accent_color ?? defaultConfig.accent_color!
  const bg = config.bg_color ?? defaultConfig.bg_color!
  const text = config.text_color ?? defaultConfig.text_color!
  const heroStyle = config.hero_style ?? defaultConfig.hero_style!
  const heroOverlay = config.hero_overlay ?? defaultConfig.hero_overlay!
  const layout = config.layout ?? defaultConfig.layout!
  const showCharacters = config.show_characters ?? defaultConfig.show_characters!
  const showSeries = config.show_series ?? defaultConfig.show_series!

  const publishedEditions = editions.filter(e => e.status === 'published')

  const maxWidth = layout === 'wide' ? 'max-w-6xl' : layout === 'sidebar' ? 'max-w-5xl' : 'max-w-3xl'

  return (
    <div style={{ backgroundColor: bg, color: text }}>
      {release.cover_image && heroStyle !== 'minimal' && (
        <div
          className="relative w-full overflow-hidden"
          style={{ height: heroStyle === 'full' ? '50vh' : '30vh' }}
        >
          <img
            src={release.cover_image}
            alt={release.title}
            className="w-full h-full object-cover"
          />
          {heroOverlay !== 'none' && (
            <div
              className="absolute inset-0"
              style={{
                background: heroOverlay === 'dark'
                  ? 'rgba(0,0,0,0.6)'
                  : `linear-gradient(to bottom, transparent 30%, ${bg})`,
              }}
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <h1 className="text-3xl md:text-5xl font-black uppercase" style={{ color: accent }}>
              {release.title}
            </h1>
            {release.genre && (
              <p className="mt-2 text-sm opacity-70">{release.genre}</p>
            )}
            {release.authors.length > 0 && (
              <p className="mt-1 text-sm opacity-60">
                {release.authors.map(a => a.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {heroStyle === 'minimal' && (
        <div className={`${maxWidth} mx-auto px-6 py-8 pt-12`}>
          <h1 className="text-3xl font-black uppercase" style={{ color: accent }}>{release.title}</h1>
          {release.genre && <p className="mt-1 text-sm opacity-70">{release.genre}</p>}
        </div>
      )}

      <div className={`${maxWidth} mx-auto px-6 py-8`}>
        {!release.cover_image && (
          <h1 className="text-3xl md:text-4xl font-black uppercase mb-4" style={{ color: accent }}>
            {release.title}
          </h1>
        )}

        {release.annotation && (
          <div className="mb-8 leading-7 text-lg opacity-80">
            {release.annotation}
          </div>
        )}

        {showSeries && seriesLink && (
          <div className="mb-6 flex items-center gap-2 text-sm opacity-60">
            <span>Серия:</span>
            <span style={{ color: accent }}>{seriesLink.series.title}</span>
            {seriesLink.phase_number && <span>· Фаза {seriesLink.phase_number}</span>}
          </div>
        )}

        {showCharacters && characters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-[0.18em] mb-4 opacity-50">Персонажи</h2>
            <div className="flex gap-4 flex-wrap">
              {characters.map(ch => (
                <Link
                  key={ch.id}
                  href={`/characters/${ch.slug}`}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
                  style={{ borderColor: `${text}20`, color: text }}
                >
                  {ch.avatar && <Image src={ch.avatar} alt={ch.name} width={24} height={24} className="rounded-full object-cover" />}
                  <span>{ch.name}</span>
                  <span className="text-xs opacity-40">{roleLabels[ch.role] ?? ch.role}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {publishedEditions.length > 0 ? (
          <div>
            <h2 className="text-xs uppercase tracking-[0.18em] mb-4 opacity-50">Издания</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {publishedEditions.map(edition => (
                <Link
                  key={edition.id}
                  href={`/release/${release.slug}/${edition.slug}`}
                  className="group rounded-lg border p-4 transition-all"
                  style={{ borderColor: `${accent}30`, backgroundColor: `${bg}` }}
                >
                  <span className="font-semibold" style={{ color: accent }}>{formatLabels[edition.format]}</span>
                  {edition.platform && <span className="text-sm opacity-60 ml-2">{edition.platform}</span>}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed py-12 text-center opacity-40">
            Издания пока не опубликованы
          </div>
        )}

        {release.description && (
          <div className="mt-12 text-sm opacity-40">
            {release.description}
          </div>
        )}
      </div>
    </div>
  )
}