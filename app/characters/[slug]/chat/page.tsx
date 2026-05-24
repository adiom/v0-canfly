import { fetchCharacterBySlug } from '@/lib/server/characters';
import Link from 'next/link';
import { CharacterChat } from '@/components/character-chat';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface ChatPageProps {
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

export async function generateMetadata({ params }: ChatPageProps) {
  const { slug } = await params;
  const data = await getCharacterData(slug);

  if (!data?.character) {
    return {
      title: 'Персонаж не найден - canfly',
    };
  }

  return {
    title: `Чат с ${data.character.name} - canfly | культура твоего сознания`,
    description: `Поговори с ${data.character.name}`,
  };
}

export default async function CharacterChatPage({ params }: ChatPageProps) {
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

  const character = data.character;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {character.avatar && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-600">
                <Image
                  src={character.avatar}
                  alt={character.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white">{character.name}</h1>
              <p className="text-xs text-slate-400">Онлайн</p>
            </div>
          </div>
          <Link href={`/characters/${character.slug}`} className="text-slate-300 hover:text-white transition-colors text-sm">
            ← Назад к персонажу
          </Link>
        </div>
      </header>

      {/* Chat */}
      <section className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        <CharacterChat
          characterSlug={character.slug}
          characterName={character.name}
          characterAvatar={character.avatar || ''}
        />
      </section>
    </main>
  );
}
