'use client'

import Link from 'next/link'
import type { Release } from '@/lib/releases-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Eye } from 'lucide-react'

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
}

export function ReleaseCard({ release }: { release: Release }) {
  return (
    <Link href={`/studio/releases/${release.id}`}>
      <Card className="group transition-colors hover:border-primary/50">
        <CardContent className="flex gap-4 p-4">
          {release.cover_image ? (
            <img
              src={release.cover_image}
              alt={release.title}
              className="h-24 w-16 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-24 w-16 items-center justify-center rounded-md bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h3 className="font-semibold group-hover:text-primary">{release.title}</h3>
              {release.genre && (
                <p className="mt-1 text-sm text-muted-foreground">{release.genre}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusVariants[release.status]}>
                {statusLabels[release.status]}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {release.view_count}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
