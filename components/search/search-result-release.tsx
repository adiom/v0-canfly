import Image from 'next/image'
import Link from 'next/link'
import { SearchResultRelease } from '@/lib/server/search'
import { highlight } from '@/lib/search-highlight'

interface SearchResultReleaseRowProps {
  release: SearchResultRelease
  query?: string
}

export function SearchResultReleaseRow({ release, query = '' }: SearchResultReleaseRowProps) {
  return (
    <li>
      <Link
        href={`/release/${release.slug}`}
        className="group flex items-center gap-4 rounded-sm px-3 py-3 transition-colors hover:bg-[#f4efe5]/6"
      >
        <div className="relative h-[4.5rem] w-12 flex-shrink-0 overflow-hidden rounded-sm bg-[#1b1c19]">
          {release.cover_image ? (
            <Image src={release.cover_image} alt={release.title} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
              <span className="text-sm font-black text-[#d52525]">{release.title[0]}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#f4efe5] group-hover:text-white">
            {highlight(release.title, query)}
          </p>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f978b]">
            Релиз{release.genre ? ` · ${release.genre}` : ''}
          </span>
          {release.snippet && (
            <p className="mt-1 line-clamp-1 text-xs text-[#6b6560]">
              {highlight(release.snippet, query)}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
