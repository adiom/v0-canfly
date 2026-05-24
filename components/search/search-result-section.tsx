interface SearchResultSectionProps {
  title: string
  children: React.ReactNode
}

export function SearchResultSection({ title, children }: SearchResultSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#d52525]">{title}</h2>
      <ul className="space-y-px">{children}</ul>
    </section>
  )
}
