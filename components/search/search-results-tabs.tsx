'use client'

import { useState } from 'react'
import type { SearchResults } from '@/lib/server/search'
import { SearchResultSection } from '@/components/search/search-result-section'
import { SearchResultReleaseRow } from '@/components/search/search-result-release'
import { SearchResultCharacterRow } from '@/components/search/search-result-character'
import { SearchResultNewsRow } from '@/components/search/search-result-news'

type Tab = 'all' | 'releases' | 'characters' | 'news'

interface SearchResultsTabsProps {
  results: SearchResults
  query: string
}

export function SearchResultsTabs({ results, query }: SearchResultsTabsProps) {
  const [tab, setTab] = useState<Tab>('all')

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: results.total },
    ...(results.releases.length > 0 ? [{ id: 'releases' as Tab, label: 'Релизы', count: results.releases.length }] : []),
    ...(results.characters.length > 0 ? [{ id: 'characters' as Tab, label: 'Персонажи', count: results.characters.length }] : []),
    ...(results.news.length > 0 ? [{ id: 'news' as Tab, label: 'Новости', count: results.news.length }] : []),
  ]

  const showReleases = tab === 'all' || tab === 'releases'
  const showCharacters = tab === 'all' || tab === 'characters'
  const showNews = tab === 'all' || tab === 'news'

  return (
    <div>
      {/* Счётчик */}
      <p className="mb-6 text-xs text-cf-text-3">
        Найдено {results.total}{' '}
        {results.total === 1 ? 'результат' : results.total < 5 ? 'результата' : 'результатов'} по запросу{' '}
        <span className="text-cf-text-2">«{query}»</span>
      </p>

      {/* Табы */}
      {tabs.length > 2 && (
        <div className="mb-8 flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex h-8 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                tab === t.id
                  ? 'border-cf-accent bg-cf-accent/10 text-cf-accent'
                  : 'border-cf-text-1/12 text-cf-text-3 hover:border-cf-text-1/25 hover:text-cf-text-2'
              }`}
            >
              {t.label}
              <span className={`text-[10px] ${tab === t.id ? 'text-cf-accent/70' : 'text-cf-text-4'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Секции */}
      {showReleases && results.releases.length > 0 && (
        <SearchResultSection title={`Релизы (${results.releases.length})`}>
          {results.releases.map((item) => (
            <SearchResultReleaseRow key={item.id} release={item} query={query} />
          ))}
        </SearchResultSection>
      )}

      {showCharacters && results.characters.length > 0 && (
        <SearchResultSection title={`Персонажи (${results.characters.length})`}>
          {results.characters.map((character) => (
            <SearchResultCharacterRow key={character.id} character={character} query={query} />
          ))}
        </SearchResultSection>
      )}

      {showNews && results.news.length > 0 && (
        <SearchResultSection title={`Новости (${results.news.length})`}>
          {results.news.map((item) => (
            <SearchResultNewsRow key={item.id} item={item} query={query} />
          ))}
        </SearchResultSection>
      )}
    </div>
  )
}
