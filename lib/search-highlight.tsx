import { Fragment } from 'react'

export function highlight(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  if (parts.length === 1) return text

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-cf-accent/25 text-inherit rounded-sm px-0.5 not-italic">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
