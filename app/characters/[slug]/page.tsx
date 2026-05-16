import { Character, CharacterRelationship } from '@/lib/types';
import { fetchCharacterBySlug } from '@/lib/server/characters';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CharacterChat } from '@/components/character-chat';

export const revalidate = 3600;

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
    return {
      title: 'Персонаж не найден - canfly',
    };
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
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              canfly
            </Link>
            <Link href="/characters" className="text-slate-300 hover:text-white">
              Назад к персонажам
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-slate-400">Персонаж не найден</p>
        </div>
      </main>
    );
  }

  const character: Character = data.character;
  const relationships: CharacterRelationship[] = data.relationships || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            canfly
          </Link>
          <Link href="/characters" className="text-slate-300 hover:text-white transition-colors">
            ← Назад к персонажам
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Avatar */}
          <div className="md:col-span-1">
            {character.avatar ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={character.avatar}
                  alt={character.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400">
                Нет фото
              </div>
            )}
            
            {/* Abilities */}
            {character.abilities && character.abilities.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Способности</h3>
                <div className="flex flex-col gap-2">
                  {character.abilities.map((ability, idx) => (
                    <div key={idx} className="bg-slate-800 px-3 py-2 rounded text-slate-300 text-sm">
                      {ability}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-2">
            <h1 className="text-5xl font-bold text-white mb-4">{character.name}</h1>
            
            <p className="text-2xl text-purple-300 mb-6">{character.bio}</p>
            
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                {character.full_description || 'Подробное описание отсутствует.'}
              </p>
            </div>

            {/* Related Characters */}
            {relationships.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-white mb-6">Связи с другими персонажами</h3>
                <div className="grid gap-4">
                  {relationships.map((rel) => (
                    <div key={rel.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white">{rel.relationship_type}</h4>
                        <span className="text-xs bg-purple-900/50 text-purple-200 px-2 py-1 rounded">
                          Связь
                        </span>
                      </div>
                      <p className="text-slate-300">{rel.description || 'Описание недоступно'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Поговори с {character.name}</h2>
          <p className="text-slate-400 mb-8">Спроси о его/её мыслях, книгах вселенной или просто поговори</p>
          <div className="h-96 flex flex-col">
            <CharacterChat 
              characterSlug={character.slug} 
              characterName={character.name}
              characterAvatar={character.avatar || ''}
            />
          </div>
        </div>
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
