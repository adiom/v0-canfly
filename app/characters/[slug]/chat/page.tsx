import { fetchCharacterBySlug } from '@/lib/server/characters';
import Link from 'next/link';
import { CharacterChat } from '@/components/character-chat';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

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
    return { title: 'Персонаж не найден - canfly', robots: { index: false, follow: false } };
  }

  return {
    title: `Чат с ${data.character.name} - canfly | культура твоего сознания`,
    description: `Поговори с ${data.character.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function CharacterChatPage({ params }: ChatPageProps) {
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

  const character = data.character;

  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            {character.avatar && (
              <div className="relative w-9 h-9 overflow-hidden border border-cf-text-1/10">
                <Image src={character.avatar} alt={character.name} fill sizes="36px" className="object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-black uppercase text-cf-text-heading">{character.name}</h1>
              <p className="text-xs text-cf-text-4 uppercase tracking-[0.12em]">Онлайн</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={`/characters/${character.slug}`}
              className="text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 hover:text-cf-text-heading transition-colors"
            >
              ← Профиль
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        {character.can_receive_messages !== false && character.reply_mode !== 'disabled' ? (
          <CharacterChat
            characterSlug={character.slug}
            characterName={character.name}
            characterAvatar={character.avatar || ''}
          />
        ) : (
          <div className="border border-cf-text-1/10 bg-cf-bg-2 p-6 text-cf-text-caption">
            Сейчас этому персонажу нельзя писать.
          </div>
        )}
      </section>
    </main>
  );
}
