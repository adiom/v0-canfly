import Image from 'next/image'
import Link from 'next/link'
import { SearchResultCharacter } from '@/lib/server/search'
import { highlight } from '@/lib/search-highlight'

interface SearchResultCharacterRowProps {
  character: SearchResultCharacter
  query?: string
}

export function SearchResultCharacterRow({ character, query = '' }: SearchResultCharacterRowProps) {
  return (
    <li>
      <Link
        href={`/characters/${character.slug}`}
        className="group flex items-center gap-4 rounded-sm px-3 py-3 transition-colors hover:bg-[#f4efe5]/6"
      >
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#1b1c19]">
          {character.avatar ? (
            <Image src={character.avatar} alt={character.name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
              <span className="text-sm font-black text-[#d52525]">{character.name[0]}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#f4efe5] group-hover:text-white">
            {highlight(character.name, query)}
          </p>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f978b]">Персонаж</span>
          {character.bio && (
            <p className="mt-1 line-clamp-1 text-xs text-[#6b6560]">
              {highlight(character.bio, query)}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
