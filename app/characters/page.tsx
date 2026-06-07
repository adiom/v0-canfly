import { Character, CharacterRelationship } from '@/lib/types';
import {
  fetchCharactersList,
  fetchRelationshipsForCharacters,
} from '@/lib/server/characters';
import { CharacterCard } from '@/components/character-card';
import { CharacterGraph } from '@/components/character-graph';
import { CharacterPostsFeed } from '@/components/character-posts-feed';
import Link from 'next/link';
import { Suspense } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Персонажи | canfly — культура твоего сознания',
  description: 'Встретьте героев вселенной и откройте их взаимосвязи',
};

const navItems = [
  { label: 'Новости', href: '/news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Миры', href: '/#worlds' },
  { label: 'Магазин', href: '/shop' },
]

async function CharactersContent() {
  try {
    const characters = await fetchCharactersList();
    const allRelationships = await fetchRelationshipsForCharacters(
      characters.map((c) => c.id)
    );

    return (
      <>
        {/* Graph Section */}
        <section className="mb-16">
          <div className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">граф связей</p>
            <h2 className="text-3xl font-black uppercase text-cf-text-heading mb-2">Карта взаимосвязей</h2>
            <p className="text-cf-text-caption">Визуализация связей между персонажами вселенной canfly</p>
          </div>
          <div className="bg-cf-bg-2 p-6 border border-cf-text-1/10">
            <div className="w-full h-96">
              <CharacterGraph characters={characters} relationships={allRelationships} />
            </div>
          </div>
        </section>

        {/* Characters Grid */}
        <section className="mb-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">профили</p>
            <h2 className="text-3xl font-black uppercase text-cf-text-heading mb-2">Персонажи</h2>
            <p className="text-cf-text-caption">Исследуйте героев, их посты и историю</p>
          </div>

          {characters.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((char) => (
                <CharacterCard key={char.id} character={char} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-cf-text-3">Персонажей не найдено</p>
            </div>
          )}
        </section>

        {/* Posts Feed */}
        <section>
          <div className="mb-8">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">активность</p>
            <h2 className="text-3xl font-black uppercase text-cf-text-heading mb-2">Лента</h2>
            <p className="text-cf-text-caption">Что думают персонажи и какие анонсы они делают</p>
          </div>
          <CharacterPostsFeed />
        </section>
      </>
    );
  } catch (error) {
    console.error('Error loading characters:', error);
    return (
      <div className="text-center py-12">
        <p className="text-cf-text-3">Ошибка при загрузке персонажей</p>
      </div>
    );
  }
}

export default function CharactersPage() {
  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-cf-accent text-lg font-black uppercase tracking-[-0.04em] text-white">
              canfly
            </span>
          </Link>

          <nav className="hidden h-14 items-center lg:flex" aria-label="Главная навигация">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.href === '/characters'
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
            <MobileNav items={navItems} />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="mb-12">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">персонажи вселенной</p>
          <h1 className="text-4xl font-black uppercase leading-none text-cf-text-heading md:text-6xl">Герои canfly</h1>
        </div>
        <Suspense fallback={<div className="text-center text-cf-text-3 py-12">Загрузка персонажей...</div>}>
          <CharactersContent />
        </Suspense>
      </section>

      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-cf-text-4 text-sm">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
        </div>
      </footer>
    </main>
  );
}
