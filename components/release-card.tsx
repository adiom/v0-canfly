import Image from 'next/image'
import Link from 'next/link'
import type { Release, EditionFormat } from '@/lib/releases-types'

const FORMAT_LABELS: Record<EditionFormat, string> = {
  book: 'Книга',
  comic: 'Комикс',
  audiobook: 'Аудиокнига',
  audiorelease: 'Аудиорелиз',
  album: 'Альбом',
  magazine: 'Журнал',
}

interface ReleaseCardProps {
  release: Release & { formats: EditionFormat[] }
  priority?: boolean
}

export function ReleaseCard({ release, priority = false }: ReleaseCardProps) {
  const primaryFormat = release.formats[0]
  const formatLabel = primaryFormat ? FORMAT_LABELS[primaryFormat] : null

  return (
    <Link href={`/release/${release.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden border border-cf-text-1/10 bg-cf-footer-bg transition-colors duration-300 group-hover:border-cf-warm/45">
        {release.cover_image ? (
          <Image
            src={release.cover_image}
            alt={release.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-cf-text-4">
              canfly
            </span>
          </div>
        )}
        {formatLabel && (
          <span className="absolute left-2 top-2 bg-cf-accent px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
            {formatLabel}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-black uppercase leading-tight text-cf-text-heading">
        {release.title}
      </p>
      {release.genre && (
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-cf-text-3">
          {release.genre}
        </p>
      )}
    </Link>
  )
}
