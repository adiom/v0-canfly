import { Newspaper, Radio } from 'lucide-react'

interface SiteFooterProps {
  variant?: 'full' | 'simple'
}

export function SiteFooter({ variant = 'simple' }: SiteFooterProps) {
  if (variant === 'full') {
    return (
      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-cf-text-4 md:flex-row md:items-center md:gap-4">
          <p>© 2005-2026 canfly | культура твоего сознания.</p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              новости
            </span>
            <span className="inline-flex items-center gap-2">
              <Radio className="h-4 w-4" />
              обновления вселенной
            </span>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg mt-20 py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-8 text-center text-sm text-cf-text-4">
        <p>© 2005-2026 canfly | культура твоего сознания.</p>
      </div>
    </footer>
  )
}
