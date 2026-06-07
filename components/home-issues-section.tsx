import Link from 'next/link'
import { fetchIssueBooks } from '@/lib/server/books'

export async function HomeIssuesSection() {
  const issues = await fetchIssueBooks(4)

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
          <Link href="/books" className="hidden text-sm font-black uppercase text-cf-accent hover:text-[#a81919] sm:block">
            все книги
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {issues.map((issue, index) => (
            <Link key={issue.id} href={`/books/${issue.slug}`} className="group border border-cf-text-1/12 bg-cf-bg">
              <div
                className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4]"
                style={{ backgroundColor: issue.tone ?? '#e8e2da' }}
              >
                <div className="absolute inset-5 border border-cf-text-1/16" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cf-text-1/60">
                    {issue.label}
                  </p>
                  <p className="mt-3 text-6xl font-black leading-none text-cf-text-1/18">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="min-h-12 text-base font-black leading-tight text-cf-text-heading sm:min-h-14 sm:text-lg">{issue.title}</h3>
                <p className="mt-3 text-sm leading-6 text-cf-text-3">{issue.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
