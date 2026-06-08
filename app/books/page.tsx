import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

import { fetchBooks } from '@/lib/server/books'
import { SearchDialog } from '@/components/search/search-dialog'
import { BookType, BookWithCharacters } from '@/lib/types'
import { generateBooksCollectionSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'
import { BooksClient } from '@/components/books-client'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Книги | canfly — литературная вселенная',
  description:
    'Каталог изданий вселенной canfly: романы, комиксы и аудио. Превью, персонажи и точки входа в мир.',
}

const navItems = [
  { label: 'Новости', href: '/#news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Миры', href: '/#worlds' },
  { label: 'Выпуски', href: '/#issues' },
  { label: 'Блог', href: '/markdown' },
]

function typeLabel(type: BookType): string {
  switch (type) {
    case 'comic':
      return 'Комикс'
    case 'audiobook':
      return 'Аудиокнига'
    default:
      return 'Книга'
  }
}

function formatPrice(kopeks: number): string {
  return (kopeks / 100).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  })
}

async function getBooks(): Promise<BookWithCharacters[]> {
  try {
    return await fetchBooks()
  } catch (error) {
    console.error('Books hub database error:', error)
    return []
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

export default async function BooksHubPage() {
  const booksRaw = await getBooks()
  const books = [...booksRaw].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    return a.display_order - b.display_order
  })
  const featured = booksRaw.filter((b) => b.is_featured)

  const collectionSchema = generateBooksCollectionSchema(books, BASE_URL)
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { label: 'Главная', url: BASE_URL },
      { label: 'Книги', url: `${BASE_URL}/books` },
    ],
  )

  return (
    <main className="min-h-screen bg-cf-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-cf-accent text-lg font-black uppercase tracking-[-0.04em] text-white">
              CF
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-cf-text-3 sm:block">
              литературная вселенная
            </span>
          </Link>

          <nav className="hidden h-14 items-center lg:flex" aria-label="Главная навигация">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.href === '/books'
                    ? 'flex h-full items-center border-x border-cf-text-1/10 bg-cf-text-1/8 px-3 text-xs font-black uppercase tracking-[0.12em] text-cf-text-heading lg:px-4'
                    : 'flex h-full items-center border-x border-transparent px-3 text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 transition-colors hover:border-cf-text-1/10 hover:bg-cf-text-1/6 hover:text-cf-text-heading lg:px-4'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SearchDialog />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-cf-text-1/10 bg-cf-bg-2 px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">каталог</p>
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-none text-cf-text-heading md:text-6xl">
            Книги вселенной
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-cf-text-caption">
            Точки входа в canfly: бумажные и цифровые издания, фрагменты в читалке и связи с персонажами.
          </p>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="border-b border-cf-text-1/10 px-4 py-12 md:px-8 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">маршрут читателя</p>
              <h2 className="text-2xl font-black uppercase text-cf-text-heading md:text-4xl">С чего начать</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cf-text-3 md:text-base">
                Подборка изданий с пометкой «избранное» — удобный старт до полного списка ниже.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((book) => (
                <FeaturedCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Full catalog */}
      <section className="px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">все издания</p>
            <h2 className="text-2xl font-black uppercase text-cf-text-heading md:text-4xl">Каталог</h2>
          </div>

          {books.length === 0 ? (
            <div className="rounded-sm border border-cf-text-1/10 bg-cf-bg-2 p-12 text-center">
              <BookOpen className="mx-auto mb-6 h-10 w-10 text-cf-text-4" />
              <p className="text-cf-text-caption">Пока нет опубликованных книг в базе.</p>
              <p className="mt-3 text-sm text-cf-text-4">Добавьте издания в админке или проверьте схему Postgres.</p>
              <Link
                href="/admin"
                className="mt-8 inline-flex h-12 items-center bg-cf-accent px-5 text-sm font-black uppercase text-white hover:bg-[#b01e1e]"
              >
                Админка
              </Link>
            </div>
          ) : (
            <BooksClient books={books} />
          )}
        </div>
      </section>

      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-cf-text-4 md:flex-row md:items-center">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
          <Link href="/" className="w-fit font-semibold text-cf-text-caption hover:text-cf-text-heading">
            ← На главную
          </Link>
        </div>
      </footer>
    </main>
  )
}

function FeaturedCard({ book }: { book: BookWithCharacters }) {
  return (
    <article className="border border-cf-text-1/10 bg-cf-bg p-5 transition-colors hover:border-cf-warm/45 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cf-blue">{typeLabel(book.type)}</span>
        {book.price ? <span className="text-xs text-cf-text-4">{formatPrice(book.price)}</span> : null}
      </div>
      {book.cover_image ? (
        <Link href={`/books/${book.slug}`} className="relative mb-5 block aspect-[4/5] overflow-hidden bg-cf-footer-bg">
          <Image
            src={book.cover_image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </Link>
      ) : null}
      <h3 className="text-lg font-black uppercase leading-tight text-cf-text-heading md:text-xl">
        <Link href={`/books/${book.slug}`} className="hover:text-cf-warm">
          {book.title}
        </Link>
      </h3>
      {book.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-cf-text-caption">{book.description}</p>
      ) : null}
      <Link
        href={`/books/${book.slug}`}
        className="mt-5 inline-flex h-11 items-center bg-cf-accent px-4 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-[#b01e1e]"
      >
        Открыть
      </Link>
    </article>
  )
}
