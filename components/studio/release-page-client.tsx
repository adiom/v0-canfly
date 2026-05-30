'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Release, Edition } from '@/lib/releases-types'
import { updateReleaseStatusAction, deleteReleaseAction } from '@/lib/actions/studio'
import { ReleaseForm } from '@/components/studio/release-form'
import { EditionCard } from '@/components/studio/edition-card'
import { EditionFormDialog } from '@/components/studio/edition-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ArrowLeft, Globe, Archive, Trash2 } from 'lucide-react'
import Link from 'next/link'

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}

export function ReleasePageClient({ release, editions }: { release: Release; editions: Edition[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleStatusChange(status: string) {
    try {
      await updateReleaseStatusAction(release.id, status)
      toast.success(`Статус: ${statusLabels[status]}`)
      router.refresh()
    } catch {
      toast.error('Ошибка смены статуса')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteReleaseAction(release.id)
    } catch {
      toast.error('Ошибка удаления')
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/studio">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="flex-1 text-2xl font-bold">{release.title}</h1>
        <Badge variant="secondary">{statusLabels[release.status]}</Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Общее</TabsTrigger>
          <TabsTrigger value="editions">Издания ({editions.length})</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <ReleaseForm release={release} />
        </TabsContent>

        <TabsContent value="editions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Издания</h2>
            <EditionFormDialog releaseId={release.id} />
          </div>
          {editions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              Нет изданий. Создайте первое издание для этого релиза.
            </div>
          ) : (
            <div className="grid gap-3">
              {editions.map(edition => (
                <EditionCard key={edition.id} edition={edition} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Статус публикации</h3>
            <div className="flex gap-2">
              {release.status !== 'published' && (
                <Button variant="default" onClick={() => handleStatusChange('published')}>
                  <Globe className="mr-2 h-4 w-4" />
                  Опубликовать
                </Button>
              )}
              {release.status !== 'archived' && (
                <Button variant="outline" onClick={() => handleStatusChange('archived')}>
                  <Archive className="mr-2 h-4 w-4" />
                  В архив
                </Button>
              )}
              {release.status !== 'draft' && (
                <Button variant="outline" onClick={() => handleStatusChange('draft')}>
                  Вернуть в черновик
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t pt-6">
            <h3 className="font-semibold text-destructive">Опасная зона</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить релиз
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить &laquo;{release.title}&raquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие необратимо. Все издания, главы и данные будут удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
