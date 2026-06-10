'use client'

import { useEffect } from 'react'

export function HighlightScroller({ highlightId }: { highlightId: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const mark = document.querySelector(`mark[data-cf-hl="${highlightId}"]`) as HTMLElement | null
      if (!mark) return
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
      mark.style.outline = '2px solid #d52525'
      mark.style.outlineOffset = '2px'
    }, 600)
    return () => clearTimeout(timer)
  }, [highlightId])

  return null
}
