import Link from 'next/link'
import { Suspense } from 'react'
import { BookOpen, Boxes, Newspaper, Radio, UserRound } from 'lucide-react'

import { HomeHeroSlider } from '@/components/home-hero-slider'
import { HomeIssuesSection } from '@/components/home-issues-section'
import { HomeNewsSection } from '@/components/home-news-section'
import {
  getPublicHomepageSlides,
  isHomepageSlidesTableMissing,
} from '@/lib/homepage-slide-store'
import { HomepageSlide } from '@/lib/types'
import { MobileNav } from '@/components/mobile-nav'
import { SearchDialog } from '@/components/search/search-dialog'
import { ThemeToggle } from '@/components/theme-toggle'

export const revalidate = 60

export const metadata = {
  title: 'canfly | культура твоего сознания',
  description:
    'canfly — литературная вселенная о тревоге, ремесле, памяти, цифровой усталости и людях, которые продолжают функционировать.',
}

const navItems = [
  { label: 'Новости', href: '/news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Миры', href: '#worlds' },
  { label: 'Выпуски', href: '#issues' },
  { label: 'Блог', href: '/markdown' },
  { label: 'Магазин', href: '/shop' },
]

export default async function Home() {
  let slides: HomepageSlide[] = []
  let isMigrationMissing = false

  try {
    slides = await getPublicHomepageSlides()
  } catch (error) {
    if (!isHomepageSlidesTableMissing(error)) {
      throw error
    }

    isMigrationMissing = true
  }

  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-[#d52525] text-lg font-black uppercase tracking-[-0.04em] text-white">
              canfly
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-cf-text-3 sm:block">
              beta
            </span>
          </Link>

          <nav className="hidden h-14 items-center lg:flex" aria-label="Главная навигация">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-full items-center border-x border-transparent px-3 text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 transition-colors hover:border-cf-text-1/10 hover:bg-cf-text-1/6 hover:text-cf-text-heading lg:px-4"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileNav items={navItems} />
            <SearchDialog />
          </div>
        </div>
      </header>

      {slides.length > 0 ? (
        <HomeHeroSlider slides={slides} />
      ) : (
        <section className="border-b border-cf-text-1/10 bg-cf-bg px-4 py-24 md:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">
              hero-слайдер
            </p>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-none text-cf-text-heading md:text-7xl">
              {isMigrationMissing ? 'Создайте таблицу слайдера' : 'Добавьте первый слайд в админке'}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cf-text-caption">
              {isMigrationMissing
                ? 'Главная страница больше не использует fallback. Выполните SQL из `postgres/schema.sql`, чтобы создать `homepage_slides` в Postgres.'
                : 'Главная страница читает слайды только из таблицы Postgres `homepage_slides`.'}
            </p>
            <Link
              href="/admin"
              className="mt-8 inline-flex h-12 items-center rounded-sm bg-cf-warm px-5 text-sm font-black uppercase text-[#171713]"
            >
              Открыть админку
            </Link>
          </div>
        </section>
      )}

      <Suspense fallback={
        <section id="issues" className="border-b border-cf-text-1/10 bg-cf-text-1 px-4 py-12 text-[#171713] md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">новые выпуски</p>
              <div className="h-12 w-40 animate-pulse rounded bg-cf-accent/20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] rounded bg-cf-accent/20" />
                  <div className="mt-3 h-6 rounded bg-cf-accent/20" />
                </div>
              ))}
            </div>
          </div>
        </section>
      }>
        <HomeIssuesSection />
      </Suspense>

      <Suspense fallback={
        <section id="news" className="border-b border-cf-text-1/10 bg-cf-bg px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">canfly dispatch</p>
              <div className="h-12 w-60 animate-pulse rounded bg-cf-text-1/10" />
            </div>
          </div>
        </section>
      }>
        <HomeNewsSection />
      </Suspense>

      <section id="worlds" className="bg-cf-bg-2 px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">
              explore canfly
            </p>
            <h2 className="text-2xl font-black uppercase leading-none text-cf-text-heading sm:text-3xl md:text-5xl">
              Входы во вселенную
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/books" className="group border border-cf-text-1/10 bg-cf-bg p-4 hover:border-cf-warm/45 sm:p-6">
              <BookOpen className="mb-8 h-7 w-7 text-cf-warm sm:mb-10" />
              <h3 className="text-xl font-black uppercase text-cf-text-heading sm:text-2xl">Книги</h3>
              <p className="mt-3 leading-7 text-cf-text-caption sm:mt-4">Романы, повести и циклы как самостоятельные точки входа.</p>
            </Link>
            <Link href="/characters" className="group border border-cf-text-1/10 bg-cf-bg p-4 hover:border-cf-blue/45 sm:p-6">
              <UserRound className="mb-8 h-7 w-7 text-cf-blue sm:mb-10" />
              <h3 className="text-xl font-black uppercase text-cf-text-heading sm:text-2xl">Персонажи</h3>
              <p className="mt-3 leading-7 text-cf-text-caption sm:mt-4">Люди функции: швеи, инженеры, операторы, сотрудники ПВЗ.</p>
            </Link>
            <Link href="/markdown" className="group border border-cf-text-1/10 bg-cf-bg p-4 hover:border-cf-tan/45 sm:p-6">
              <Boxes className="mb-8 h-7 w-7 text-cf-tan sm:mb-10" />
              <h3 className="text-xl font-black uppercase text-cf-text-heading sm:text-2xl">Архив</h3>
              <p className="mt-3 leading-7 text-cf-text-caption sm:mt-4">Старая главная и большой markdown-путеводитель по системе мира.</p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-cf-text-4 md:flex-row md:items-center md:gap-4">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              новости
            </span>
            <span className="inline-flex items-center gap-2">
              <Radio className="h-4 w-4" />
              обновления вселенной
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
