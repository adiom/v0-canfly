'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Edition, Chapter } from '@/lib/releases-types'
import { createChapterAction, deleteEditionAction, updateEditionStatusAction } from '@/lib/actions/studio'
import { ChapterList } from '@/components/studio/chapter-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ArrowLeft, Plus, Trash2, Settings, Globe, Archive } from 'lucide-react'

const formatLabels: Record<string, string> = {
  book: 'Книга', comic: 'Комикс', audiobook: 'Аудиокнига',
  audiorelease: 'Аудиорелиз', album: 'Альбом', magazine: 'Журнал',
}

const chapterLabels: Record<string, string> = {
  book: 'Главы', comic: 'Главы', audiobook: 'Треки',
  audiorelease: 'Треки', album: 'Треки', magazine: 'Статьи',
}

const addLabels: Record<string, string> = {
  book: 'Добавить главу', comic: 'Добавить главу', audiobook: 'Добавить трек',
  audiorelease: 'Добавить трек', album: 'Добавить трек', magazine: 'Добавить статью',
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}

export function EditionPageClient({ edition, chapters }: { edition: Edition; chapters: Chapter[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const chapterLabel = chapterLabels[edition.format] ?? 'Главы'
  const addLabel = addLabels[edition.format] ?? 'Добавить главу'

  async function handleAddChapter() {
    setCreating(true)
    try {
      const formData = new FormData()
      formData.set('edition_id', edition.id)
      formData.set('title', `${chapterLabel === 'Треки' ? 'Трек' : chapterLabel === 'Статьи' ? 'Статья' : 'Глава'} ${chapters.length + 1}`)
      await createChapterAction(formData)
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка создания')
      setCreating(false)
    }
  }

  async function handleDeleteEdition() {
    try {
      await deleteEditionAction(edition.id, edition.release_id)
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка удаления')
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await updateEditionStatusAction(edition.id, status)
      toast.success(`Статус: ${statusLabels[status]}`)
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка смены статуса')
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
        <Badge variant="secondary">{statusLabels[edition.status] ?? edition.status}</Badge>
      </div>

      <Tabs defaultValue="chapters" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chapters">{chapterLabel} ({chapters.length})</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{chapterLabel}</CardTitle>
              <Button size="sm" onClick={handleAddChapter} disabled={creating}>
                <Plus className="mr-2 h-4 w-4" />
                {creating ? 'Создаю...' : addLabel}
              </Button>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                  Нет {chapterLabel.toLowerCase()}. Нажмите &laquo;{addLabel}&raquo;, чтобы начать.
                </div>
              ) : (
                <ChapterList chapters={chapters} editionId={edition.id} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-medium">Настройки издания</p>
                <p className="text-sm text-muted-foreground">Slug, платформа, обложка, персонажи, серия</p>
              </div>
              <Link href={`/studio/editions/${edition.id}/setup`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Открыть настройки
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Статус издания</h3>
            <div className="flex gap-2">
              {edition.status !== 'published' && (
                <Button variant="default" onClick={() => handleStatusChange('published')}>
                  <Globe className="mr-2 h-4 w-4" />
                  Опубликовать
                </Button>
              )}
              {edition.status !== 'archived' && (
                <Button variant="outline" onClick={() => handleStatusChange('archived')}>
                  <Archive className="mr-2 h-4 w-4" />
                  В архив
                </Button>
              )}
              {edition.status !== 'draft' && (
                <Button variant="outline" onClick={() => handleStatusChange('draft')}>
                  Вернуть в черновик
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
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
                    Все {chapterLabel.toLowerCase()} этого издания будут удалены. Это действие необратимо.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteEdition}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}