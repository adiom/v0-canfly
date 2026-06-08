import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-3 mb-12" aria-label="canfly">
          <span className="flex h-9 w-16 items-center justify-center bg-cf-accent text-lg font-black uppercase tracking-[-0.04em] text-white">
            canfly
          </span>
        </Link>

        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cf-accent mb-4">
          404 · Страница не найдена
        </p>
        <h1 className="text-4xl font-black uppercase leading-none text-cf-text-heading mb-4 md:text-5xl">
          Такой страницы нет
        </h1>
        <p className="leading-7 text-cf-text-caption mb-10">
          Возможно, адрес изменился или страница была удалена.
          Вернитесь на главную и попробуйте найти нужное там.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="h-12 px-5 bg-cf-accent text-white font-black uppercase text-sm tracking-[0.1em] hover:bg-[#b81e1e] transition-colors inline-flex items-center"
          >
            На главную
          </Link>
          <Link
            href="/search"
            className="h-12 px-5 border border-cf-text-1/18 text-cf-text-1 font-bold uppercase text-sm hover:bg-cf-text-1/8 transition-colors inline-flex items-center"
          >
            Поиск
          </Link>
        </div>
      </div>
    </main>
  )
}
