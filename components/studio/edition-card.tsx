'use client'

import Link from 'next/link'
import type { Edition } from '@/lib/releases-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Headphones, Image, Music, Newspaper } from 'lucide-react'

const formatIcons: Record<string, React.ElementType> = {
  book: BookOpen,
  comic: Image,
  audiobook: Headphones,
  album: Music,
  magazine: Newspaper,
}

const formatLabels: Record<string, string> = {
  book: 'Книга',
  comic: 'Комикс',
  audiobook: 'Аудиокнига',
  album: 'Альбом',
  magazine: 'Журнал',
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}

export function EditionCard({ edition }: { edition: Edition }) {
  const Icon = formatIcons[edition.format] ?? BookOpen

  return (
    <Link href={`/studio/editions/${edition.id}`}>
      <Card className="group transition-colors hover:border-primary/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium group-hover:text-primary">
              {formatLabels[edition.format]}
            </p>
            {edition.platform && (
              <p className="text-sm text-muted-foreground">{edition.platform}</p>
            )}
          </div>
          <Badge variant="secondary">{statusLabels[edition.status]}</Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
