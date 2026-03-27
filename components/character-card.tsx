import { Character } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link href={`/characters/${character.slug}`}>
      <div className="bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 group cursor-pointer h-full">
        {/* Avatar */}
        {character.avatar ? (
          <div className="relative w-full h-64 overflow-hidden bg-slate-900">
            <Image
              src={character.avatar}
              alt={character.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400">
            Нет фото
          </div>
        )}

        {/* Info */}
        <div className="p-4">
          <h3 className="text-xl font-bold text-white mb-2">{character.name}</h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{character.bio}</p>
          <Button variant="outline" size="sm" className="w-full">
            Узнать больше
          </Button>
        </div>
      </div>
    </Link>
  );
}
