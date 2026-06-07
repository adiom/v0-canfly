import { Character, CharacterRelationship } from '@/lib/types';
import { fetchCharacterBySlug } from '@/lib/server/characters';
import Image from 'next/image';
import Link from 'next/link';
import { CharacterFriendButton } from '@/components/character-friend-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';

export const dynamic = 'force-dynamic';

const navItems = [
  { label: 'Новости', href: '/news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Миры', href: '/#worlds' },
  { label: 'Магазин', href: '/shop' },
]

interface CharacterPageProps {
  params: Promise<{ slug: string }>;
}

async function getCharacterData(slug: string) {
  try {
    return await fetchCharacterBySlug(slug);
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CharacterPageProps) {
  const { slug } = await params;
  const data = await getCharacterData(slug);

  if (!data?.character) {
    return { title: 'Персонаж не найден - canfly' };
  }

  return {
    title: `${data.character.name} - canfly | культура твоего сознания`,
    description: data.character.bio,
  };
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { slug } = await params;
  const data = await getCharacterData(slug);

  if (!data?.character) {
    return (
      <main className="min-h-screen bg-cf-bg text-cf-text-1">
        <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
            <Link href="/" className="flex h-9 w-16 items-center justify-center bg-cf-accent text-lg font-black uppercase tracking-[-0.04em] text-white">
              canfly
            </Link>
            <Link href="/characters" className="text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 hover:text-cf-text-heading">
              ← Персонажи
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-cf-text-3">Персонаж не найден</p>
        </div>
      </main>
    );
  }

  const character: Character = data.character;
  const relationships: CharacterRelationship[] = data.relationships || [];
  const mainBooks = (data.books || []).filter((book) => book.role === 'main');
  const supportingBooks = (data.books || []).filter((book) => book.role !== 'main');

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

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-6">
          <Link href="/characters" className="text-xs font-black uppercase tracking-[0.18em] text-cf-text-3 hover:text-cf-text-heading transition-colors">
            ← Персонажи
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Avatar */}
          <div className="md:col-span-1">
            {character.avatar ? (
              <div className="relative w-full aspect-square overflow-hidden">
                <Image src={character.avatar} alt={character.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-square bg-cf-bg-2 border border-cf-text-1/10 flex items-center justify-center text-cf-text-4">
                Нет фото
              </div>
            )}

            {character.abilities && character.abilities.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cf-accent">Способности</p>
                <div className="flex flex-col gap-2">
                  {character.abilities.map((ability, idx) => (
                    <div key={idx} className="border border-cf-text-1/10 bg-cf-bg-2 px-3 py-2 text-cf-text-caption text-sm">
                      {ability}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-2">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">персонаж</p>
            <h1 className="text-4xl font-black uppercase leading-tight text-cf-text-heading md:text-5xl mb-3">
              {character.name}
            </h1>
            <p className="text-xl text-cf-text-caption mb-8">{character.bio}</p>

            <div className="mb-8">
              <CharacterFriendButton
                characterSlug={character.slug}
                canReceiveMessages={character.can_receive_messages !== false && character.reply_mode !== 'disabled'}
              />
            </div>

            <div className="mb-8">
              <p className="text-cf-text-2 text-base leading-7 whitespace-pre-wrap">
                {character.full_description || 'Подробное описание отсутствует.'}
              </p>
            </div>

            {(mainBooks.length > 0 || supportingBooks.length > 0) && (
              <div className="mt-10 pt-10 border-t border-cf-text-1/10">
                <p className="mb-6 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">Книги с персонажем</p>

                {mainBooks.length > 0 && (
                  <div className="mb-8">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cf-warm">Основные книги</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {mainBooks.map((book) => (
                        <Link
                          key={book.id}
                          href={`/books/${book.slug}`}
                          className="group flex gap-4 border border-cf-text-1/10 bg-cf-bg-2 p-4 transition-colors hover:border-cf-warm/45"
                        >
                          {book.cover_image ? (
                            <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden border border-cf-text-1/10">
                              <Image src={book.cover_image} alt={book.title} fill className="object-cover" />
                            </div>
                          ) : null}
                          <div>
                            <h4 className="font-black uppercase text-cf-text-heading group-hover:text-cf-warm">{book.title}</h4>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cf-text-4">Главная роль</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {supportingBooks.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cf-text-4">Второстепенные появления</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {supportingBooks.map((book) => (
                        <Link
                          key={book.id}
                          href={`/books/${book.slug}`}
                          className="border border-cf-text-1/10 bg-cf-bg-2 p-4 transition-colors hover:border-cf-warm/45"
                        >
                          <h4 className="font-black uppercase text-cf-text-heading">{book.title}</h4>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cf-text-4">
                            {book.role === 'cameo' ? 'Камео' : book.role === 'mentioned' ? 'Упоминание' : 'Вторая роль'}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {relationships.length > 0 && (
              <div className="mt-10 pt-10 border-t border-cf-text-1/10">
                <p className="mb-6 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">Связи</p>
                <div className="grid gap-4">
                  {relationships.map((rel) => (
                    <div key={rel.id} className="border border-cf-text-1/10 bg-cf-bg-2 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black uppercase text-cf-text-heading">{rel.relationship_type}</h4>
                        <span className="text-xs border border-cf-blue/30 bg-cf-blue/10 text-cf-blue px-2 py-1">
                          Связь
                        </span>
                      </div>
                      <p className="text-cf-text-caption">{rel.description || 'Описание недоступно'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Chat CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="border border-cf-text-1/10 bg-cf-bg-2 p-8 text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">диалог</p>
          <h2 className="text-2xl font-black uppercase text-cf-text-heading mb-3">Поговори с {character.name}</h2>
          <p className="text-cf-text-caption mb-8">Спроси о его/её мыслях, книгах вселенной или просто поговори</p>
          <Link
            href={`/characters/${character.slug}/chat`}
            className="inline-flex h-12 items-center bg-cf-accent px-6 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-[#b01e1e]"
          >
            Начать чат
          </Link>
        </div>
      </section>

      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg mt-4 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-cf-text-4 text-sm">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
        </div>
      </footer>
    </main>
  );
}
