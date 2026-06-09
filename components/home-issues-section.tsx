import Link from 'next/link'
import Image from 'next/image'
import { fetchRecentReleaseEvents } from '@/lib/server/releases'
import type { EditionFormat, ReleaseEventType } from '@/lib/releases-types'

const FORMAT_LABEL: Record<EditionFormat, string> = {
  book: 'книга',
  comic: 'комикс',
  audiobook: 'аудиокнига',
  audiorelease: 'аудиорелиз',
  album: 'альбом',
  magazine: 'журнал',
}

const EVENT_LABEL: Record<ReleaseEventType, string> = {
  new_edition: 'новое издание',
  new_chapter: 'новая глава',
}

export async function HomeIssuesSection() {
  const events = await fetchRecentReleaseEvents(4)

  return (
    <section id="issues" className="border-b border-cf-text-1/10 bg-cf-bg-2 px-4 py-12 text-cf-text-1 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">
              новые выпуски
            </p>
            <h2 className="text-2xl font-black uppercase leading-none sm:text-3xl md:text-5xl">Свежие фрагменты</h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event, index) => (
            <Link
              key={`${event.event_type}-${event.edition_id}-${event.chapter_index ?? 'x'}`}
              href={
                event.event_type === 'new_edition'
                  ? `/release/${event.release_slug}/${event.edition_slug}`
                  : `/release/${event.release_slug}/${event.edition_slug}/${(event.chapter_index ?? 0)}`
              }
              className="group border border-cf-text-1/10 bg-cf-bg transition-colors hover:border-cf-warm/45"
            >
              <div className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4] bg-cf-bg-2">
                {event.cover_image ? (
                  <Image
                    src={event.cover_image}
                    alt={event.release_title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <>
                    <div className="absolute inset-5 border border-cf-text-1/16" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="mt-3 text-6xl font-black leading-none text-cf-text-1/18">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                    </div>
                  </>
                )}
                <div className="absolute bottom-5 left-5 right-5 z-10">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cf-text-1/60">
                    {FORMAT_LABEL[event.format]}
                    {event.event_type === 'new_chapter' && ` · ${EVENT_LABEL[event.event_type]}`}
                  </p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="min-h-12 text-base font-black leading-tight text-cf-text-heading sm:min-h-14 sm:text-lg">
                  {event.release_title}
                </h3>
                {event.chapter_title && (
                  <p className="mt-1 text-sm font-bold text-cf-warm">{event.chapter_title}</p>
                )}
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cf-text-3">
                  {EVENT_LABEL[event.event_type]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}