import Link from 'next/link'

interface SearchNoResultsProps {
  query: string
}

export function SearchNoResults({ query }: SearchNoResultsProps) {
  return (
    <div className="py-16 text-center">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">Результаты поиска</p>
      <h2 className="mb-4 text-2xl font-black uppercase leading-none text-[#fff8ea]">
        Ничего не найдено
      </h2>
      <p className="mb-8 text-sm text-[#9f978b]">
        По запросу <span className="text-[#ded7cc]">«{query}»</span> ничего не нашлось.
        <br />
        Попробуйте более короткий или общий запрос.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/books"
          className="flex h-10 items-center border border-[#f4efe5]/12 px-5 text-xs font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:bg-[#f4efe5]/8 hover:text-white"
        >
          Все книги
        </Link>
        <Link
          href="/characters"
          className="flex h-10 items-center border border-[#f4efe5]/12 px-5 text-xs font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:bg-[#f4efe5]/8 hover:text-white"
        >
          Персонажи
        </Link>
      </div>
    </div>
  )
}
