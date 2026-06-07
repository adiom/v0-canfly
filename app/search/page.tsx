import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'

import { searchAll } from '@/lib/server/search'
import { fetchBooks } from '@/lib/server/books'
import { fetchCharactersList } from '@/lib/server/characters'
import { SearchResultSection } from '@/components/search/search-result-section'
import { SearchResultBookRow } from '@/components/search/search-result-book'
import { SearchResultCharacterRow } from '@/components/search/search-result-character'
import { SearchResultNewsRow } from '@/components/search/search-result-news'
import { SearchNoResults } from '@/components/search/search-no-results'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  return {
    title: query ? `«${query}» — поиск | canfly` : 'Поиск | canfly',
  }
}

const navItems = [
  { label: 'Новости', href: '/#news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Миры', href: '/#worlds' },
  { label: 'Выпуски', href: '/#issues' },
  { label: 'Блог', href: '/markdown' },
  { label: 'Магазин', href: '/shop' },
]

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const results = query.length >= 2 ? await searchAll(query) : null

  // Browse state: fetch latest books + characters when no query
  let browseBooks: { id: string; title: string; slug: string; cover_image: string | null; type: string }[] = []
  let browseCharacters: { id: string; name: string; slug: string; avatar: string | null }[] = []
  if (!results) {
    try {
      const [books, characters] = await Promise.all([fetchBooks(), fetchCharactersList()])
      browseBooks = books.slice(0, 4).map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        cover_image: b.cover_image,
        type: b.type,
      }))
      browseCharacters = characters.slice(0, 3).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        avatar: c.avatar,
      }))
    } catch {
      // non-critical, show empty browse state
    }
  }

  return (
    <main className="min-h-screen bg-[#111210] text-[#f4efe5]">
      <header className="sticky top-0 z-50 border-b border-[#f4efe5]/10 bg-[#111210]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-[#d52525] text-lg font-black uppercase tracking-[-0.04em] text-white">
              canfly
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[#9f978b] sm:block">
              beta
            </span>
          </Link>

          <nav className="hidden h-14 items-center lg:flex" aria-label="Главная навигация">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-full items-center border-x border-transparent px-3 text-xs font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:border-[#f4efe5]/10 hover:bg-[#f4efe5]/6 hover:text-white lg:px-4"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/search"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#f4efe5]/12 text-[#ded7cc] hover:bg-[#f4efe5]/8"
            aria-label="Поиск"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {/* Search form */}
        <form method="get" action="/search" className="mb-10">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9f978b]" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Поиск книг, персонажей, новостей…"
              autoFocus
              className="h-14 w-full rounded-sm border border-[#f4efe5]/12 bg-[#1b1c19] pl-12 pr-4 text-base text-[#f4efe5] placeholder-[#6b6560] outline-none transition-colors focus:border-[#d52525]/60 focus:bg-[#111210]"
            />
          </div>
        </form>

        {/* No query — browse state */}
        {!results && (
          <div>
            <p className="mb-8 text-sm text-[#9f978b]">
              Введите запрос, чтобы найти книги, персонажей или новости вселенной canfly.
            </p>
            {browseBooks.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">Книги</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {browseBooks.map((book) => (
                    <Link key={book.id} href={`/books/${book.slug}`} className="group block">
                      <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded-sm bg-[#1b1c19]">
                        {book.cover_image ? (
                          <Image src={book.cover_image} alt={book.title} fill className="object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
                            <span className="text-lg font-black text-[#d52525]">CF</span>
                          </div>
                        )}
                      </div>
                      <p className="truncate text-xs font-bold text-[#ded7cc] group-hover:text-white">{book.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {browseCharacters.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">Персонажи</h2>
                <div className="flex gap-4">
                  {browseCharacters.map((c) => (
                    <Link key={c.id} href={`/characters/${c.slug}`} className="group flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#1b1c19]">
                        {c.avatar ? (
                          <Image src={c.avatar} alt={c.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
                            <span className="text-xs font-black text-[#d52525]">{c.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#ded7cc] group-hover:text-white">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Results */}
        {results && results.total === 0 && <SearchNoResults query={query} />}

        {results && results.total > 0 && (
          <div>
            <p className="mb-8 text-xs text-[#9f978b]">
              Найдено {results.total} {results.total === 1 ? 'результат' : results.total < 5 ? 'результата' : 'результатов'} по запросу{' '}
              <span className="text-[#ded7cc]">«{query}»</span>
            </p>

            {results.books.length > 0 && (
              <SearchResultSection title={`Книги (${results.books.length})`}>
                {results.books.map((book) => (
                  <SearchResultBookRow key={book.id} book={book} />
                ))}
              </SearchResultSection>
            )}

            {results.characters.length > 0 && (
              <SearchResultSection title={`Персонажи (${results.characters.length})`}>
                {results.characters.map((character) => (
                  <SearchResultCharacterRow key={character.id} character={character} />
                ))}
              </SearchResultSection>
            )}

            {results.news.length > 0 && (
              <SearchResultSection title={`Новости (${results.news.length})`}>
                {results.news.map((item) => (
                  <SearchResultNewsRow key={item.id} item={item} />
                ))}
              </SearchResultSection>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
