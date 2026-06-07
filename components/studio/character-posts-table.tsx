'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Clock } from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteCharacterPostAction } from '@/lib/actions/studio-characters'
import type { CharacterPost } from '@/lib/types'

const postTypeLabels: Record<string, string> = {
  thought: 'Мысль',
  announcement: 'Анонс',
  question: 'Вопрос',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CharacterPostsTable({
  characterId,
  posts,
}: {
  characterId: string
  posts: CharacterPost[]
}) {
  const [now] = useState(() => Date.now())

  async function handleDelete(postId: string) {
    try {
      await deleteCharacterPostAction(postId)
      toast.success('Пост удалён')
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Не удалось удалить')
    }
  }

  if (posts.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        Постов пока нет
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const scheduled = post.scheduled_at && new Date(post.scheduled_at).getTime() > now
        return (
          <Card key={post.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{postTypeLabels[post.post_type] ?? post.post_type}</Badge>
                  {scheduled ? (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(post.scheduled_at!)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                  )}
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm">{post.content}</p>
                {post.image_url ? (
                  <p className="mt-2 text-xs text-muted-foreground">📎 с изображением</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/studio/characters/${characterId}/posts/${post.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <Trash2 className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить пост?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие необратимо.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(post.id)}>
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
