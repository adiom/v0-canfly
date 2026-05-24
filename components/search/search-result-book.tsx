import Image from 'next/image'
import Link from 'next/link'
import { SearchResultBook } from '@/lib/server/search'

const BOOK_TYPE_LABELS: Record<string, string> = {
  comic: 'Комикс',
  book: 'Книга',
  audiobook: 'Аудиокнига',
}

interface SearchResultBookRowProps {
  book: SearchResultBook
}

export function SearchResultBookRow({ book }: SearchResultBookRowProps) {
  return (
    <li>
      <Link
        href={`/books/${book.slug}`}
        className="group flex items-center gap-4 rounded-sm px-3 py-3 transition-colors hover:bg-[#f4efe5]/6"
      >
        <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-sm bg-[#1b1c19]">
          {book.cover_image ? (
            <Image src={book.cover_image} alt={book.title} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
              <span className="text-xs font-black text-[#d52525]">CF</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#f4efe5] group-hover:text-white">{book.title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f978b]">
              {BOOK_TYPE_LABELS[book.type] ?? 'Книга'}
            </span>
            {book.label && (
              <>
                <span className="text-[#9f978b]">·</span>
                <span className="text-xs text-[#9f978b]">{book.label}</span>
              </>
            )}
          </div>
          {book.description && (
            <p className="mt-1 line-clamp-1 text-xs text-[#6b6560]">{book.description}</p>
          )}
        </div>
      </Link>
    </li>
  )
}
