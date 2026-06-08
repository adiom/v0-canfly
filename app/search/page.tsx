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
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

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
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <SiteHeader activePath="/search" showSearch={false} />

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {/* Search form */}
        <form method="get" action="/search" className="mb-10">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cf-text-3" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Поиск книг, персонажей, новостей…"
              autoFocus
              className="h-14 w-full rounded-sm border border-cf-text-1/12 bg-cf-bg-2 pl-12 pr-4 text-base text-cf-text-1 placeholder-cf-text-3 outline-none transition-colors focus:border-cf-accent/60 focus:bg-cf-bg"
            />
          </div>
        </form>

        {/* No query — browse state */}
        {!results && (
          <div>
            <p className="mb-8 text-sm text-cf-text-3">
              Введите запрос, чтобы найти книги, персонажей или новости вселенной canfly.
            </p>
            {browseBooks.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">Книги</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {browseBooks.map((book) => (
                    <Link key={book.id} href={`/books/${book.slug}`} className="group block">
                      <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded-sm bg-cf-bg-2">
                        {book.cover_image ? (
                          <Image src={book.cover_image} alt={book.title} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-cf-accent/20">
                            <span className="text-lg font-black text-cf-accent">CF</span>
                          </div>
                        )}
                      </div>
                      <p className="truncate text-xs font-bold text-cf-text-2 group-hover:text-cf-text-heading">{book.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {browseCharacters.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">Персонажи</h2>
                <div className="flex gap-4">
                  {browseCharacters.map((c) => (
                    <Link key={c.id} href={`/characters/${c.slug}`} className="group flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-cf-bg-2">
                        {c.avatar ? (
                          <Image src={c.avatar} alt={c.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-cf-accent/20">
                            <span className="text-xs font-black text-cf-accent">{c.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-cf-text-2 group-hover:text-cf-text-heading">{c.name}</span>
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
            <p className="mb-8 text-xs text-cf-text-3">
              Найдено {results.total} {results.total === 1 ? 'результат' : results.total < 5 ? 'результата' : 'результатов'} по запросу{' '}
              <span className="text-cf-text-2">«{query}»</span>
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
      <SiteFooter />\n    </main>
  )
}
