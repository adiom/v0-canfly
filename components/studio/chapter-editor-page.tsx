'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Chapter } from '@/lib/releases-types'
import { publishChapterAction, deleteChapterAction } from '@/lib/actions/studio'
import { TelegraphEditor } from '@/components/studio/telegraph-editor'
import { VersionHistory } from '@/components/studio/version-history'
import { Button } from '@/components/ui/button'
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
import { ArrowLeft, Globe, Trash2, Check, Loader2, AlertCircle } from 'lucide-react'

export function ChapterEditorPage({ chapter, editionId }: { chapter: Chapter; editionId: string }) {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handlePublish() {
    try {
      await publishChapterAction(chapter.id)
      toast.success('Глава опубликована')
      router.refresh()
    } catch {
      toast.error('Ошибка публикации')
    }
  }

  async function handleDelete() {
    try {
      await deleteChapterAction(chapter.id)
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-3">
          <Link href={`/studio/editions/${editionId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex flex-1 items-center gap-2">
            <Badge variant={chapter.status === 'published' ? 'default' : 'secondary'}>
              {chapter.status === 'published' ? 'Опубликована' : 'Черновик'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {saveStatus === 'saving' && <Loader2 className="inline h-3 w-3 animate-spin" />}
              {saveStatus === 'saved' && <Check className="inline h-3 w-3 text-green-500" />}
              {saveStatus === 'error' && <AlertCircle className="inline h-3 w-3 text-destructive" />}
              {saveStatus === 'saving' && ' Сохраняю...'}
              {saveStatus === 'saved' && ' Сохранено'}
              {saveStatus === 'error' && ' Ошибка'}
            </span>
          </div>

          <VersionHistory chapterId={chapter.id} />

          {chapter.status !== 'published' && (
            <Button size="sm" onClick={handlePublish}>
              <Globe className="mr-2 h-4 w-4" />
              Опубликовать
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить главу?</AlertDialogTitle>
                <AlertDialogDescription>
                  Глава и все её версии будут удалены. Это необратимо.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <TelegraphEditor
          chapterId={chapter.id}
          initialTitle={chapter.title}
          initialContent={chapter.content}
          onSaveStatus={setSaveStatus}
        />
      </div>
    </div>
  )
}
