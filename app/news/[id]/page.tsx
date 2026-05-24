import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchNewsPostById } from '@/lib/server/books'

export const dynamic = 'force-dynamic'

interface NewsPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: NewsPageProps) {
  const { id } = await params
  const post = await fetchNewsPostById(id)

  if (!post) {
    return { title: 'Новость не найдена — canfly' }
  }

  return {
    title: `${post.title} — canfly`,
    description: post.content?.slice(0, 160) ?? post.title,
  }
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { id } = await params
  const post = await fetchNewsPostById(id)

  if (!post || !post.is_active) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#111210] text-[#f4efe5]">
      <header className="sticky top-0 z-50 border-b border-[#f4efe5]/10 bg-[#111210]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-16 items-center justify-center bg-[#d52525] text-lg font-black uppercase tracking-[-0.04em] text-white">
              CF
            </span>
          </Link>
          <Link href="/#news" className="text-sm font-black uppercase tracking-[0.12em] text-[#ded7cc] hover:text-white">
            ← Новости
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#9db5c8]">
          {post.section}
        </p>
        <h1 className="text-4xl font-black uppercase leading-none text-[#fff8ea] md:text-6xl">
          {post.title}
        </h1>
        {post.tag && (
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#8f877c]">{post.tag}</p>
        )}
        {post.content && (
          <div className="mt-10 text-lg leading-8 text-[#c9c1b4] whitespace-pre-wrap">
            {post.content}
          </div>
        )}
        <p className="mt-12 text-xs text-[#8f877c]">
          {new Date(post.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </article>

      <footer className="border-t border-[#f4efe5]/10 bg-[#0c0d0c] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-[#8f877c]">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
        </div>
      </footer>
    </main>
  )
}
