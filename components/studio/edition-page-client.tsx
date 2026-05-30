'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Edition, Chapter } from '@/lib/releases-types'
import { createChapterAction, deleteEditionAction } from '@/lib/actions/studio'
import { ChapterList } from '@/components/studio/chapter-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

const formatLabels: Record<string, string> = {
  book: 'Книга', comic: 'Комикс', audiobook: 'Аудиокнига',
  album: 'Альбом', magazine: 'Журнал',
}

export function EditionPageClient({ edition, chapters }: { edition: Edition; chapters: Chapter[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleAddChapter() {
    setCreating(true)
    try {
      const formData = new FormData()
      formData.set('edition_id', edition.id)
      formData.set('title', `Глава ${chapters.length + 1}`)
      await createChapterAction(formData)
    } catch {
      toast.error('Ошибка создания главы')
      setCreating(false)
    }
  }

  async function handleDeleteEdition() {
    try {
      await deleteEditionAction(edition.id, edition.release_id)
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/studio/releases/${edition.release_id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{formatLabels[edition.format]}</h1>
          {edition.platform && <p className="text-muted-foreground">{edition.platform}</p>}
        </div>
        <Badge variant="secondary">{edition.status}</Badge>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Главы</CardTitle>
            <Button size="sm" onClick={handleAddChapter} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              {creating ? 'Создаю...' : 'Добавить главу'}
            </Button>
          </CardHeader>
          <CardContent>
            {chapters.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                Нет глав. Нажмите &laquo;Добавить главу&raquo;, чтобы начать.
              </div>
            ) : (
              <ChapterList chapters={chapters} editionId={edition.id} />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить издание
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить издание?</AlertDialogTitle>
                <AlertDialogDescription>
                  Все главы этого издания будут удалены. Это действие необратимо.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEdition}>Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
