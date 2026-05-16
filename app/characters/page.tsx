import { Character, CharacterRelationship } from '@/lib/types';
import { CharacterCard } from '@/components/character-card';
import { CharacterGraph } from '@/components/character-graph';
import { CharacterPostsFeed } from '@/components/character-posts-feed';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
  title: 'Персонажи - canfly | культура твоего сознания',
  description: 'Встретьте героев вселенной и откройте их взаимосвязи',
};

async function CharactersContent() {
  try {
    const [charactersRes, relationshipsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/characters`, {
        next: { revalidate: 3600 },
      }),
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/characters`,
        {
          next: { revalidate: 3600 },
        }
      ),
    ]);

    const characters: Character[] = await charactersRes.json();
    
    // Get all relationships
    let allRelationships: CharacterRelationship[] = [];
    for (const char of characters) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/characters/${char.slug}`,
        {
          next: { revalidate: 3600 },
        }
      );
      const data = await res.json();
      allRelationships = [...allRelationships, ...data.relationships];
    }

    return (
      <>
        {/* Graph Section */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Карта взаимосвязей</h2>
            <p className="text-slate-400">Визуализация связей между персонажами вселенной Canfly</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="w-full h-96">
              <CharacterGraph characters={characters} relationships={allRelationships} />
            </div>
          </div>
        </section>

        {/* Characters Grid */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Профили персонажей</h2>
            <p className="text-slate-400">Исследуйте героев, их посты и историю</p>
          </div>
          
          {characters.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((char) => (
                <CharacterCard key={char.id} character={char} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Персонажей не найдено</p>
            </div>
          )}
        </section>

        {/* Posts Feed */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Лента активности</h2>
            <p className="text-slate-400">Что думают персонажи и какие анонсы они делают</p>
          </div>
          <CharacterPostsFeed />
        </section>
      </>
    );
  } catch (error) {
    console.error('Error loading characters:', error);
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Ошибка при загрузке персонажей</p>
      </div>
    );
  }
}

export default function CharactersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            canfly
          </Link>
          
          <nav className="flex gap-6 items-center">
            <Link href="/characters" className="text-purple-400">
              Персонажи
            </Link>
            <Link href="/shop" className="text-slate-300 hover:text-white transition-colors">
              Магазин
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">Корзина</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Suspense fallback={<div className="text-center text-slate-400">Загрузка персонажей...</div>}>
          <CharactersContent />
        </Suspense>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2024 canfly | культура твоего сознания. Все права защищены.</p>
        </div>
      </footer>
    </main>
  );
}
