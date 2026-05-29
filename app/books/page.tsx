import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

import { fetchBooks } from '@/lib/server/books'
import { SearchDialog } from '@/components/search/search-dialog'
import { BookType, BookWithCharacters } from '@/lib/types'
import { generateBooksCollectionSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'
import { BooksClient } from '@/components/books-client'

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
    BASE_URL,
  )

  return (
    <main className="min-h-screen bg-[#111210]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="sticky top-0 z-50 border-b border-[#f4efe5]/10 bg-[#111210]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-[#d52525] text-lg font-black uppercase tracking-[-0.04em] text-white">
              CF
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[#9f978b] sm:block">
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
                    ? 'flex h-full items-center border-x border-[#f4efe5]/10 bg-[#f4efe5]/8 px-3 text-xs font-black uppercase tracking-[0.12em] text-white lg:px-4'
                    : 'flex h-full items-center border-x border-transparent px-3 text-xs font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:border-[#f4efe5]/10 hover:bg-[#f4efe5]/6 hover:text-white lg:px-4'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <SearchDialog />
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#f4efe5]/10 bg-[#1b1c19] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">каталог</p>
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-none text-[#fff8ea] md:text-6xl">
            Книги вселенной
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c9c1b4]">
            Точки входа в canfly: бумажные и цифровые издания, фрагменты в читалке и связи с персонажами.
          </p>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="border-b border-[#f4efe5]/10 px-4 py-12 md:px-8 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">маршрут читателя</p>
              <h2 className="text-2xl font-black uppercase text-[#fff8ea] md:text-4xl">С чего начать</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8f877c] md:text-base">
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
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">все издания</p>
            <h2 className="text-2xl font-black uppercase text-[#fff8ea] md:text-4xl">Каталог</h2>
          </div>

          {books.length === 0 ? (
            <div className="rounded-sm border border-[#f4efe5]/10 bg-[#1b1c19] p-12 text-center">
              <BookOpen className="mx-auto mb-6 h-10 w-10 text-[#8f877c]" />
              <p className="text-[#c9c1b4]">Пока нет опубликованных книг в базе.</p>
              <p className="mt-3 text-sm text-[#8f877c]">Добавьте издания в админке или проверьте схему Postgres.</p>
              <Link
                href="/admin"
                className="mt-8 inline-flex h-12 items-center bg-[#d52525] px-5 text-sm font-black uppercase text-white hover:bg-[#b01e1e]"
              >
                Админка
              </Link>
            </div>
          ) : (
            <BooksClient books={books} />
          )}
        </div>
      </section>

      <footer className="border-t border-[#f4efe5]/10 bg-[#0c0d0c] px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#8f877c] md:flex-row md:items-center">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
          <Link href="/" className="w-fit font-semibold text-[#c9c1b4] hover:text-[#fff8ea]">
            ← На главную
          </Link>
        </div>
      </footer>
    </main>
  )
}

function FeaturedCard({ book }: { book: BookWithCharacters }) {
  return (
    <article className="border border-[#f4efe5]/10 bg-[#111210] p-5 transition-colors hover:border-[#f6d6a8]/45 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9db5c8]">{typeLabel(book.type)}</span>
        {book.price ? <span className="text-xs text-[#8f877c]">{formatPrice(book.price)}</span> : null}
      </div>
      {book.cover_image ? (
        <Link href={`/books/${book.slug}`} className="relative mb-5 block aspect-[4/5] overflow-hidden bg-[#0c0d0c]">
          <Image
            src={book.cover_image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </Link>
      ) : null}
      <h3 className="text-lg font-black uppercase leading-tight text-[#fff8ea] md:text-xl">
        <Link href={`/books/${book.slug}`} className="hover:text-[#f6d6a8]">
          {book.title}
        </Link>
      </h3>
      {book.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#c9c1b4]">{book.description}</p>
      ) : null}
      <Link
        href={`/books/${book.slug}`}
        className="mt-5 inline-flex h-11 items-center bg-[#d52525] px-4 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-[#b01e1e]"
      >
        Открыть
      </Link>
    </article>
  )
}
