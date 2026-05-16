import Link from 'next/link'
import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface AdminShellProps {
  title: string
  description?: string
  children: ReactNode
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <Link
            href="/admin"
            className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent"
          >
            Canfly Admin
          </Link>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              К списку
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description ? <p className="mt-2 text-slate-400">{description}</p> : null}
        </div>

        {children}
      </section>
    </main>
  )
}

