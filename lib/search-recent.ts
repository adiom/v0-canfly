const KEY = 'cf:recent-searches'
const MAX = 6

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return
  const q = query.trim()
  if (q.length < 2) return
  try {
    const existing = getRecentSearches().filter((s) => s !== q)
    const updated = [q, ...existing].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // localStorage может быть недоступен (приватный режим)
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
