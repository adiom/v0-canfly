'use client'

import Link from 'next/link'
import type { Release } from '@/lib/releases-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Eye, ExternalLink } from 'lucide-react'

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}

const statusBadgeStyles: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-600 border-amber-200/80',
  published: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
  archived: 'bg-gray-100 text-gray-500 border-gray-200/80',
}

export function ReleaseCard({ release }: { release: Release }) {
  return (
    <div className="group bg-white/60 backdrop-blur-md border border-white/70 shadow-sm shadow-black/5 rounded-2xl transition-all duration-300 hover:bg-white/80 hover:shadow-md hover:shadow-black/8 hover:-translate-y-0.5 hover:border-white/90">
      <div className="flex gap-4 p-4 md:p-5">
        <Link href={`/studio/releases/${release.id}`} className="flex gap-4 flex-1 min-w-0">
          {release.cover_image ? (
            <img
              src={release.cover_image}
              alt={release.title}
              className="h-24 w-16 rounded-xl object-cover border border-white/70 shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-rose-50 border border-white/70">
              <BookOpen className="h-6 w-6 text-violet-400/60" />
            </div>
          )}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-200 truncate">{release.title}</h3>
              {release.genre && (
                <p className="mt-1 text-sm text-gray-500">{release.genre}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-lg ${statusBadgeStyles[release.status]}`}>
                {statusLabels[release.status]}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Eye className="h-3 w-3" />
                {release.view_count}
              </span>
            </div>
          </div>
        </Link>
        <Link href={`/release/${release.slug}`} target="_blank">
          <Button className="shrink-0 h-8 bg-white/70 backdrop-blur-sm border border-white/70 px-3 text-xs font-semibold text-gray-600 rounded-xl shadow-sm transition-all duration-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 hover:shadow-md">
            <ExternalLink className="mr-1.5 h-3 w-3" />
            Перейти
          </Button>
        </Link>
      </div>
    </div>
  )
}