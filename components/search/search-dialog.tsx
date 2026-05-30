'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import type { AutocompleteItem } from '@/lib/server/search'

export function SearchDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AutocompleteItem[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
      if (!res.ok) {
        setResults([])
        return
      }
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchResults(value), 300)
    },
    [fetchResults],
  )

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      setResults([])
      router.push(href)
    },
    [router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && query.trim().length >= 2) {
        setOpen(false)
        setQuery('')
        setResults([])
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    },
    [query, router],
  )

  const books = results.filter((r) => r.kind === 'book')
  const characters = results.filter((r) => r.kind === 'character')
  const news = results.filter((r) => r.kind === 'news')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 cursor-pointer touch-manipulation items-center justify-center rounded-sm border border-[#f4efe5]/12 text-[#ded7cc] transition-colors hover:bg-[#f4efe5]/8"
        aria-label="Поиск (Cmd+K)"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Книги, персонажи, новости…"
          value={query}
          onValueChange={handleQueryChange}
          onKeyDown={handleKeyDown}
        />

        {query.length >= 2 && !loading && results.length === 0 && (
          <CommandEmpty>Ничего не найдено</CommandEmpty>
        )}

        {query.length >= 2 && query.trim().length >= 2 && (
          <CommandGroup heading="">
            <CommandItem
              value={`__search__${query}`}
              onSelect={() => handleSelect(`/search?q=${encodeURIComponent(query.trim())}`)}
              className="text-[#9f978b]"
            >
              <Search className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Искать «{query}» — все результаты</span>
            </CommandItem>
          </CommandGroup>
        )}

        {books.length > 0 && (
          <CommandGroup heading="Книги">
            {books.map((item) => (
              <CommandItem
                key={item.id}
                value={`book-${item.id}`}
                onSelect={() => handleSelect(item.href)}
              >
                <div className="relative mr-3 h-9 w-6 flex-shrink-0 overflow-hidden rounded-sm bg-[#1b1c19]">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" sizes="24px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
                      <span className="text-[8px] font-black text-[#d52525]">CF</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.title}</span>
                  <span className="text-xs text-[#9f978b]">{item.subtitle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {characters.length > 0 && (
          <CommandGroup heading="Персонажи">
            {characters.map((item) => (
              <CommandItem
                key={item.id}
                value={`character-${item.id}`}
                onSelect={() => handleSelect(item.href)}
              >
                <div className="relative mr-3 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#1b1c19]">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" sizes="32px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#d52525]/20">
                      <span className="text-xs font-black text-[#d52525]">{item.title[0]}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.title}</span>
                  <span className="text-xs text-[#9f978b]">{item.subtitle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {news.length > 0 && (
          <CommandGroup heading="Новости">
            {news.map((item) => (
              <CommandItem
                key={item.id}
                value={`news-${item.id}`}
                onSelect={() => handleSelect(item.href)}
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.title}</span>
                  <span className="text-xs text-[#9f978b]">{item.subtitle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandDialog>
    </>
  )
}
