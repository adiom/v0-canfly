'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const YM_ID = 42420764

declare global {
  interface Window {
    ym: (...args: unknown[]) => void
  }
}

export function YandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window.ym === 'function') {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      window.ym(YM_ID, 'hit', url)
    }
  }, [pathname, searchParams])

  return null
}
