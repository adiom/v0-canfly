'use client'

import Link from 'next/link'
import type { Chapter } from '@/lib/releases-types'
import { Badge } from '@/components/ui/badge'
import { FileText, GripVertical } from 'lucide-react'

export function ChapterList({ chapters, editionId }: { chapters: Chapter[]; editionId: string }) {
  return (
    <div className="divide-y rounded-md border">
      {chapters.map(chapter => (
        <Link
          key={chapter.id}
          href={`/studio/editions/${editionId}/chapters/${chapter.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 font-medium">{chapter.title}</span>
          <span className="text-xs text-muted-foreground">
            {chapter.word_count} сл.
          </span>
          <Badge variant={chapter.status === 'published' ? 'default' : 'secondary'}>
            {chapter.status === 'published' ? 'Опубликована' : 'Черновик'}
          </Badge>
        </Link>
      ))}
    </div>
  )
}
