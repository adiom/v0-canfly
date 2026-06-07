import { notFound } from 'next/navigation'
import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from '@/components/mobile-nav'
import { CharacterProfileHeader } from '@/components/character-profile-header'
import { CharacterProfileTabs } from '@/components/character-profile-tabs'
import {
  fetchCharacterBySlug,
  fetchCharacterFriends,
  fetchCharacterStats,
} from '@/lib/server/characters'
import { listVisibleCharacterPosts } from '@/lib/server/character-posts'
import { fetchWallPosts } from '@/lib/server/character-wall'
import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'

export const dynamic = 'force-dynamic'

const navItems = [
  { label: 'Новости', href: '/news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Миры', href: '/#worlds' },
  { label: 'Магазин', href: '/shop' },
]

interface CharacterPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

async function getCharacterData(slug: string) {
  try {
    return await fetchCharacterBySlug(slug)
  } catch (error) {
    console.error('Error fetching character:', error)
    return null
  }
}

export async function generateMetadata({ params }: CharacterPageProps) {
  const { slug } = await params
  const data = await getCharacterData(slug)
  if (!data?.character) return { title: 'Персонаж не найден - canfly' }
  return {
    title: `${data.character.name} - canfly | культура твоего сознания`,
    description: data.character.bio,
  }
}

const VALID_TABS = ['feed', 'about', 'relations', 'books', 'wall'] as const
type Tab = (typeof VALID_TABS)[number]

function normalizeTab(value: string | undefined): Tab {
  return VALID_TABS.includes(value as Tab) ? (value as Tab) : 'feed'
}

export default async function CharacterPage({ params, searchParams }: CharacterPageProps) {
  const { slug } = await params
  const { tab } = await searchParams
  const data = await getCharacterData(slug)
  if (!data?.character) notFound()

  const activeTab = normalizeTab(tab)

  const [stats, friends, posts, wall, currentUser] = await Promise.all([
    fetchCharacterStats(data.character.id),
    fetchCharacterFriends(data.character.id, 12),
    listVisibleCharacterPosts(data.character.slug),
    fetchWallPosts(data.character.id, { includeHidden: false, limit: 50 }),
    getCurrentUserFromCookie(),
  ])

  const isAdmin = currentUser
    ? (await getUserRoles(currentUser.id)).includes('admin')
    : false

  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-cf-accent text-lg font-black uppercase tracking-[-0.04em] text-white">
              canfly
            </span>
          </Link>
          <nav className="hidden h-14 items-center lg:flex">
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
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-6">
          <Link
            href="/characters"
            className="text-xs font-black uppercase tracking-[0.18em] text-cf-text-3 hover:text-cf-text-heading transition-colors"
          >
            ← Персонажи
          </Link>
        </div>

        <CharacterProfileHeader character={data.character} stats={stats} />

        <CharacterProfileTabs
          slug={data.character.slug}
          activeTab={activeTab}
          character={data.character}
          relationships={data.relationships ?? []}
          books={data.books ?? []}
          posts={posts}
          friends={friends}
          wall={wall}
          currentUserId={currentUser?.id ?? null}
          isAdmin={isAdmin}
        />
      </section>

      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-cf-text-4 text-sm">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
        </div>
      </footer>
    </main>
  )
}
