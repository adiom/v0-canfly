'use client'

import Link from 'next/link'
import type { Chapter } from '@/lib/releases-types'
import { Badge } from '@/components/ui/badge'
import { FileText, GripVertical } from 'lucide-react'

const statusBadgeStyles: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-600 border-amber-200/80',
  published: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
}

export function ChapterList({ chapters, editionId }: { chapters: Chapter[]; editionId: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm shadow-black/5 divide-y divide-white/70">
      {chapters.map(chapter => (
        <Link
          key={chapter.id}
          href={`/studio/editions/${editionId}/chapters/${chapter.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-violet-50/40"
        >
          <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="flex-1 font-medium text-gray-900">{chapter.title}</span>
          <span className="text-xs text-gray-400">
            {chapter.word_count} сл.
          </span>
          <Badge variant="outline" className={`border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-lg ${statusBadgeStyles[chapter.status]}`}>
            {chapter.status === 'published' ? 'Опубликована' : 'Черновик'}
          </Badge>
        </Link>
      ))}
    </div>
  )
}