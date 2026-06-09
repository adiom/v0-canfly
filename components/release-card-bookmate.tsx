import Image from 'next/image'
import Link from 'next/link'
import type { Release, EditionFormat } from '@/lib/releases-types'

interface ReleaseCardBookmateProps {
  release: Release & { formats: EditionFormat[] }
  priority?: boolean
}

export function ReleaseCardBookmate({ release, priority = false }: ReleaseCardBookmateProps) {
  const authorName = release.authors?.[0]?.name ?? null

  return (
    <Link href={`/release/${release.slug}`} className="group block w-[186px] shrink-0">
      <div className="relative w-full aspect-[3/4] bg-[#ebe5d9]">
        {release.cover_image ? (
          <Image
            src={release.cover_image}
            alt={release.title}
            fill
            sizes="186px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-bold text-[#8a7e74]">canfly</span>
          </div>
        )}
      </div>
      {authorName && (
        <p className="mt-1.5 text-sm font-normal text-[#302119] leading-5 truncate">
          {authorName}
        </p>
      )}
      <p className="text-sm font-bold text-[#302119] leading-5 line-clamp-2">
        {release.title}
      </p>
    </Link>
  )
}