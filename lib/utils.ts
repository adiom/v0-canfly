import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' })

  if (diffSec < 60) return rtf.format(-diffSec, 'second')
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  if (diffHr < 24) return rtf.format(-diffHr, 'hour')
  if (diffDay < 30) return rtf.format(-diffDay, 'day')
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month')
  return rtf.format(-diffYear, 'year')
}
