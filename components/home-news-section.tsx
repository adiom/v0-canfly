import { fetchNewsPosts } from '@/lib/server/books'

export async function HomeNewsSection() {
  const news = await fetchNewsPosts(3)

  return (
    <section id="news" className="border-b border-[#f4efe5]/10 bg-[#111210] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">
            canfly dispatch
          </p>
          <h2 className="text-2xl font-black uppercase leading-none text-[#fff8ea] sm:text-3xl md:text-5xl">
            Новости, заметки, маршруты
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {news.map((item) => (
            <article key={item.id} className="border-t border-[#f4efe5]/18 pt-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#9db5c8]">
                {item.section}
              </p>
              <h3 className="text-xl font-bold leading-tight text-[#f4efe5]">{item.title}</h3>
              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-[#8f877c]">{item.tag}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
