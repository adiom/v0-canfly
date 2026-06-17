'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Headphones, BookMarked, Disc3, Newspaper, Music2,
  ExternalLink, Quote, ArrowRight, Clock, AlignLeft, Heart, BookText,
} from 'lucide-react'
import type {
  Release, Edition, EditionFormat, QualityTier, ReleaseDesignConfig, Series, ChapterHighlight,
} from '@/lib/releases-types'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const defaultConfig: ReleaseDesignConfig = {
  accent_color: '#d52525',
  bg_color: '#111210',
  text_color: '#f4efe5',
  show_characters: true,
  show_series: true,
}

const formatLabels: Record<EditionFormat, string> = {
  book: 'Книга', comic: 'Комикс', audiobook: 'Аудиокнига',
  audiorelease: 'Аудиорелиз', album: 'Альбом', magazine: 'Журнал',
}

const formatIcons: Record<EditionFormat, typeof BookOpen> = {
  book: BookOpen, comic: BookMarked, audiobook: Headphones,
  audiorelease: Disc3, album: Music2, magazine: Newspaper,
}

const formatActionLabels: Record<EditionFormat, string> = {
  book: 'Читать', comic: 'Смотреть', audiobook: 'Слушать',
  audiorelease: 'Слушать', album: 'Слушать', magazine: 'Читать',
}

const formatHeroLabels: Record<EditionFormat, string> = {
  book: 'Читать', comic: 'Смотреть', audiobook: 'Слушать аудиокнигу',
  audiorelease: 'Слушать релиз', album: 'Слушать альбом', magazine: 'Читать выпуск',
}

const audioFormats: Set<EditionFormat> = new Set(['audiobook', 'audiorelease', 'album'])

const tierLabels: Record<QualityTier, string> = {
  draft: 'Черновик',
  standard: 'Книга',
  premium: 'Иллюстрированная',
}

const roleLabels: Record<string, string> = {
  main: 'Главный', supporting: 'Второстепенный', cameo: 'Камео',
}

function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

function formatWordCount(words: number): string {
  if (words >= 1000) return `${(words / 1000).toFixed(words >= 10000 ? 0 : 1)} тыс. слов`
  return `${words} слов`
}

function getEditionReadUrl(release: { slug: string }, edition: Edition): string {
  if (edition.format === 'book') {
    return `/release/${release.slug}/book/${edition.quality_tier}/1`
  }
  return `/release/${release.slug}/${edition.slug}/1`
}

function getEditionFullUrl(release: { slug: string }, edition: Edition): string {
  if (edition.format === 'book') {
    return `/release/${release.slug}/book/${edition.quality_tier}/full`
  }
  return `/release/${release.slug}/${edition.slug}/full`
}

function findAlternateEdition(published: Edition[], primary: Edition | null): Edition | null {
  if (!primary) return null
  const primaryIsAudio = audioFormats.has(primary.format)
  const alternate = published.find(e => {
    if (e.id === primary.id) return false
    if (primaryIsAudio) return e.format === 'book' || e.format === 'magazine'
    return audioFormats.has(e.format)
  })
  return alternate ?? null
}

interface ReleasePagePublicProps {
  release: Release
  editions: Edition[]
  primaryEditionSlug: string | null
  primaryEditionTier: string | null
  characters: { id: string; name: string; slug: string; avatar: string | null; role: string }[]
  seriesLink: { series: Series; phase_number: number | null } | null
  highlights: ChapterHighlight[]
  meta: { chapterCount: number; wordCount: number; readingMinutes: number; durationSeconds: number }
}

export function ReleasePagePublic({
  release, editions, primaryEditionSlug, primaryEditionTier, characters, seriesLink, highlights, meta,
}: ReleasePagePublicProps) {
  const config = release.design_config ?? {}
  const accent = config.accent_color ?? defaultConfig.accent_color!
  const bg = config.bg_color ?? defaultConfig.bg_color!
  const text = config.text_color ?? defaultConfig.text_color!
  const showCharacters = config.show_characters ?? defaultConfig.show_characters!
  const showSeries = config.show_series ?? defaultConfig.show_series!

  const [showAllQuotes, setShowAllQuotes] = useState(false)

  const published = editions.filter(e => e.status === 'published')
  const internalEditions = published
  const externalEditions = published.filter(e => e.external_url)

  const primaryEdition = published.find(e => e.slug === primaryEditionSlug) ?? null
  const primaryIsAudio = primaryEdition ? audioFormats.has(primaryEdition.format) : false
  const coverIsSquare = primaryIsAudio
  const readUrl = primaryEdition ? getEditionReadUrl(release, primaryEdition) : null
  const fullUrl = primaryEdition && !primaryIsAudio ? getEditionFullUrl(release, primaryEdition) : null

  const alternateEdition = findAlternateEdition(published, primaryEdition)
  const alternateUrl = alternateEdition ? getEditionReadUrl(release, alternateEdition) : null

  const visibleQuotes = showAllQuotes ? highlights : highlights.slice(0, 3)

  const metaChips: { icon: typeof Clock; label: string }[] = []
  if (meta.chapterCount > 0) {
    const unit = primaryIsAudio
      ? pluralRu(meta.chapterCount, 'трек', 'трека', 'треков')
      : pluralRu(meta.chapterCount, 'глава', 'главы', 'глав')
    metaChips.push({ icon: primaryIsAudio ? Music2 : AlignLeft, label: `${meta.chapterCount} ${unit}` })
  }
  if (meta.wordCount > 0 && !primaryIsAudio) metaChips.push({ icon: BookText, label: formatWordCount(meta.wordCount) })
  if (meta.readingMinutes > 0 && !primaryIsAudio) metaChips.push({ icon: Clock, label: formatReadingTime(meta.readingMinutes) })
  if (primaryIsAudio) {
    if (meta.durationSeconds > 0) {
      const h = Math.floor(meta.durationSeconds / 3600)
      const m = Math.floor((meta.durationSeconds % 3600) / 60)
      metaChips.push({ icon: Clock, label: h > 0 ? `${h} ч ${m} мин` : `${m} мин` })
    }
  }

  const PrimaryIcon = primaryEdition ? formatIcons[primaryEdition.format] : BookOpen

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: text }}>
      <SiteHeader activePath="/releases" />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {release.cover_image && (
          <div className="pointer-events-none absolute inset-0">
            <img
              src={release.cover_image}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
              style={{ opacity: 0.18, filter: 'blur(28px) saturate(1.1)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, ${bg}cc 0%, ${bg}f2 55%, ${bg} 100%)` }}
            />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-12 md:px-8 md:pb-20 md:pt-20">
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-14">
            {/* Обложка */}
            <div className="mx-auto w-44 sm:w-56 md:mx-0 md:w-full">
              <div
                className={`relative overflow-hidden shadow-2xl ${
                  coverIsSquare ? 'aspect-square rounded-xl' : 'aspect-[2/3] rounded-sm'
                }`}
                style={{ boxShadow: `0 30px 80px -30px ${accent}55, 0 10px 30px rgba(0,0,0,0.6)` }}
              >
                {release.cover_image ? (
                  <img src={release.cover_image} alt={release.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${text}10` }}>
                    <BookOpen className="h-10 w-10 opacity-30" />
                  </div>
                )}
              </div>
            </div>

            {/* Метаданные */}
            <div className="flex flex-col justify-end text-center md:text-left">
              <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-[0.22em] md:justify-start">
                {release.genre && <span style={{ color: accent }}>{release.genre}</span>}
                {showSeries && seriesLink && (
                  <>
                    {release.genre && <span className="opacity-30">·</span>}
                    <span className="opacity-60">
                      {seriesLink.series.title}
                      {seriesLink.phase_number ? ` · Фаза ${seriesLink.phase_number}` : ''}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-[family-name:var(--font-cormorant)] text-5xl font-bold italic leading-[0.9] md:text-7xl">
                {release.title}
              </h1>

              {release.authors.length > 0 && (
                <p className="mt-4 text-sm opacity-70 md:text-base">
                  {release.authors.map(a => a.name).join(', ')}
                </p>
              )}

              {metaChips.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs opacity-55 md:justify-start">
                  {metaChips.map((chip, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <chip.icon className="h-3.5 w-3.5" />
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              {readUrl && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <Link
                    href={readUrl}
                    className="inline-flex h-12 items-center gap-2 px-7 text-sm font-black uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: accent }}
                  >
                    <PrimaryIcon className="h-4 w-4" />
                    {primaryEdition ? formatHeroLabels[primaryEdition.format] : 'Читать'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {fullUrl && (
                    <Link
                      href={fullUrl}
                      className="inline-flex h-12 items-center gap-2 border px-6 text-sm font-black uppercase tracking-[0.12em] transition-colors"
                      style={{ borderColor: `${text}25`, color: text }}
                    >
                      <BookText className="h-4 w-4" />
                      Одним файлом
                    </Link>
                  )}
                  {alternateUrl && alternateEdition && (
                    <Link
                      href={alternateUrl}
                      className="inline-flex h-12 items-center gap-2 border px-6 text-sm font-black uppercase tracking-[0.12em] transition-colors"
                      style={{ borderColor: `${accent}35`, color: accent }}
                    >
                      {audioFormats.has(alternateEdition.format)
                        ? <Disc3 className="h-4 w-4" />
                        : <BookOpen className="h-4 w-4" />
                      }
                      {formatActionLabels[alternateEdition.format]}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        {/* Аннотация */}
        {release.annotation && (
          <section className="border-t py-10 md:py-14" style={{ borderColor: `${text}12` }}>
            <p className="font-[family-name:var(--font-cormorant)] text-2xl italic leading-relaxed opacity-90 md:text-[28px] md:leading-[1.5]">
              {release.annotation}
            </p>
          </section>
        )}

        {/* Где читать и слушать */}
        {(internalEditions.length > 0 || externalEditions.length > 0) && (
          <section className="border-t py-10 md:py-14" style={{ borderColor: `${text}12` }}>
            <h2 className="mb-6 text-[11px] font-black uppercase tracking-[0.22em] opacity-50">
              Где читать и слушать
            </h2>

            {internalEditions.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {internalEditions.map(edition => {
                  const Icon = formatIcons[edition.format] ?? BookOpen
                  const tierLabel = edition.format === 'book' && edition.quality_tier
                    ? tierLabels[edition.quality_tier as QualityTier] ?? null
                    : null
                  return (
                    <Link
                      key={edition.id}
                      href={getEditionReadUrl(release, edition)}
                      className="group flex items-center gap-4 border p-4 transition-all hover:-translate-y-0.5"
                      style={{ borderColor: `${text}15`, backgroundColor: `${text}06` }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm"
                        style={{ backgroundColor: `${accent}1f`, color: accent }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatLabels[edition.format]}</span>
                          {tierLabel && (
                            <span
                              className="text-[10px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5"
                              style={{
                                backgroundColor: `${accent}1f`,
                                color: accent,
                              }}
                            >
                              {tierLabel}
                            </span>
                          )}
                        </span>
                        {edition.platform && (
                          <span className="block truncate text-xs opacity-50">{edition.platform}</span>
                        )}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.1em] opacity-60 transition-opacity group-hover:opacity-100"
                        style={{ color: accent }}
                      >
                        {formatActionLabels[edition.format]}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Другие площадки */}
            {externalEditions.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  На других площадках
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {externalEditions.map(edition => (
                    <a
                      key={edition.id}
                      href={edition.external_url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:border-current"
                      style={{ borderColor: `${text}20`, color: text }}
                    >
                      {edition.platform ?? formatLabels[edition.format]}
                      <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Цитаты читателей */}
        {highlights.length > 0 && (
          <section className="border-t py-10 md:py-14" style={{ borderColor: `${text}12` }}>
            <h2 className="mb-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] opacity-50">
              <Quote className="h-4 w-4" style={{ color: accent }} />
              Цитаты читателей
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleQuotes.map(h => (
                <Link
                  key={h.id}
                  href={`/release/${release.slug}/highlight/${h.id}`}
                  className="group relative flex flex-col border p-5 transition-all hover:-translate-y-0.5"
                  style={{ borderColor: `${text}15`, backgroundColor: `${text}06` }}
                >
                  <span
                    className="pointer-events-none absolute right-4 top-2 font-[family-name:var(--font-cormorant)] text-5xl italic leading-none opacity-15"
                    style={{ color: accent }}
                    aria-hidden
                  >
                    »
                  </span>
                  <p className="relative font-[family-name:var(--font-cormorant)] text-lg italic leading-snug">
                    {h.text_content}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs opacity-55">
                    <span className="truncate">{h.user_name ?? 'Читатель'}</span>
                    {h.likes_count > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Heart className="h-3.5 w-3.5" style={{ color: accent }} />
                        {h.likes_count}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {highlights.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllQuotes(v => !v)}
                className="mt-6 text-xs font-black uppercase tracking-[0.15em] opacity-60 transition-opacity hover:opacity-100"
                style={{ color: accent }}
              >
                {showAllQuotes ? 'Свернуть' : `Показать ещё (${highlights.length - 3})`}
              </button>
            )}
          </section>
        )}

        {/* Персонажи */}
        {showCharacters && characters.length > 0 && (
          <section className="border-t py-10 md:py-14" style={{ borderColor: `${text}12` }}>
            <h2 className="mb-6 text-[11px] font-black uppercase tracking-[0.22em] opacity-50">Персонажи</h2>
            <div className="flex flex-wrap gap-3">
              {characters.map(ch => (
                <Link
                  key={ch.id}
                  href={`/characters/${ch.slug}`}
                  className="flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-colors hover:border-current"
                  style={{ borderColor: `${text}20`, color: text }}
                >
                  {ch.avatar ? (
                    <img src={ch.avatar} alt={ch.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: `${accent}25`, color: accent }}>
                      {ch.name.charAt(0)}
                    </span>
                  )}
                  <span className="font-medium">{ch.name}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-40">{roleLabels[ch.role] ?? ch.role}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Описание */}
        {release.description && (
          <section className="border-t py-10 md:py-14" style={{ borderColor: `${text}12` }}>
            <div className="leading-7 opacity-70 whitespace-pre-line">{release.description}</div>
          </section>
        )}

        {!readUrl && externalEditions.length === 0 && (
          <div className="border-t py-16 text-center opacity-40" style={{ borderColor: `${text}12` }}>
            Издания пока не опубликованы
          </div>
        )}
      </div>

      <SiteFooter variant="simple" />
    </div>
  )
}
