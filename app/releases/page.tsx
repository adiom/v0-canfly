import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { fetchReleasesWithEditions } from '@/lib/server/releases'
import type { Release, EditionFormat } from '@/lib/releases-types'
import { ReleaseCatalog } from '@/components/releases-catalog'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Релизы | canfly — литературная вселенная',
  description:
    'Каталог всех релизов вселенной canfly: комиксы, книги, аудиокниги и многое другое.',
}

type ReleaseWithFormats = Release & { formats: EditionFormat[] }

function HeroBanner({ release }: { release: ReleaseWithFormats }) {
  const accentColor = release.design_config?.accent_color
  return (
    <section className="relative flex min-h-[520px] items-end overflow-hidden bg-cf-footer-bg md:min-h-[600px]">
      {release.cover_image && (
        <Image
          src={release.cover_image}
          alt={release.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
          style={{ opacity: 0.45 }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-cf-bg via-cf-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-cf-bg via-cf-bg/20 to-transparent" />

      <div className="relative z-10 w-full max-w-7xl px-4 pb-12 md:px-8 md:pb-16">
        <div className="max-w-xl">
          <p
            className="mb-3 text-[10px] font-black uppercase tracking-[0.22em]"
            style={{ color: accentColor ?? undefined }}
          >
            {!accentColor && <span className="text-cf-accent">Новый релиз</span>}
            {accentColor && 'Новый релиз'}
          </p>
          <h1 className="text-5xl font-black uppercase leading-[0.88] text-cf-text-heading md:text-7xl">
            {release.title}
          </h1>
          {release.annotation && (
            <p className="mt-5 line-clamp-3 text-sm leading-7 text-cf-text-2 md:text-base">
              {release.annotation}
            </p>
          )}
          {release.genre && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-cf-text-3">
              {release.genre}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/release/${release.slug}`}
              className="inline-flex h-12 items-center bg-cf-accent px-6 text-sm font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#b81e1e]"
            >
              Читать
            </Link>
            <Link
              href={`/release/${release.slug}`}
              className="inline-flex h-12 items-center border border-cf-text-1/18 px-6 text-sm font-bold uppercase tracking-[0.08em] text-cf-text-1 transition-colors hover:bg-cf-text-1/8"
            >
              Подробнее
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function ReleasesPage() {
  const releases = await fetchReleasesWithEditions({ status: 'published' })

  const featured = releases[0] ?? null

  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <SiteHeader activePath="/releases" />

      {featured ? (
        <HeroBanner release={featured} />
      ) : (
        <div className="border-b border-cf-text-1/10 py-24 text-center">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-cf-accent">
            каталог
          </p>
          <h1 className="text-4xl font-black uppercase leading-none text-cf-text-heading md:text-6xl">
            Релизы
          </h1>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {releases.length > 0 ? (
          <ReleaseCatalog releases={releases} />
        ) : (
          <div className="py-24 text-center text-cf-text-3">Релизов пока нет</div>
        )}
      </div>

      <SiteFooter variant="simple" />
    </main>
  )
}
