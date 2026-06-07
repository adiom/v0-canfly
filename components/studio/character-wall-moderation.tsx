'use client'

import { Eye, EyeOff, Trash2 } from 'lucide-react'
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
import {
  deleteStudioWallPostAction,
  setWallPostHiddenAction,
} from '@/lib/actions/studio-characters'
import type { CharacterWallPostWithUser } from '@/lib/types'

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CharacterWallModeration({
  wallPosts,
}: {
  wallPosts: CharacterWallPostWithUser[]
}) {
  async function toggleHidden(post: CharacterWallPostWithUser) {
    try {
      await setWallPostHiddenAction(post.id, !post.hidden)
      toast.success(post.hidden ? 'Показано' : 'Скрыто')
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Не удалось обновить')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStudioWallPostAction(id)
      toast.success('Запись удалена')
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Не удалось удалить')
    }
  }

  if (wallPosts.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        На стене пока никто не оставлял сообщений
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {wallPosts.map((post) => (
        <Card
          key={post.id}
          className={`p-4 ${post.hidden ? 'border-dashed opacity-60' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <span className="font-medium">{post.user.display_name}</span>
                <span className="text-muted-foreground">@{post.user.handle}</span>
                {post.hidden ? <Badge variant="outline">Скрыто</Badge> : null}
                <span className="text-xs text-muted-foreground">
                  · {formatDate(post.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{post.content}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" onClick={() => toggleHidden(post)}>
                {post.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
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
      ))}
    </div>
  )
}
