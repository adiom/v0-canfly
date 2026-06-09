'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Chapter, ChapterEditorialNote } from '@/lib/releases-types'
import { publishChapterAction, deleteChapterAction } from '@/lib/actions/studio'
import { TelegraphEditor } from '@/components/studio/telegraph-editor'
import { VersionHistory } from '@/components/studio/version-history'
import { EditorialNotesPanel } from '@/components/studio/editorial-notes-panel'
import { EditorialNotesOverlay } from '@/components/studio/editorial-notes-overlay'
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
  const [editorialNotes, setEditorialNotes] = useState<ChapterEditorialNote[]>([])
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [, setContentVersion] = useState(0)

  const handleNoteFocus = useCallback((note: ChapterEditorialNote) => {
    const container = editorRef.current
    if (!container || !note.text_content) return

    const proseMirror = container.querySelector('.ProseMirror')
    if (!proseMirror) return

    const paragraphs: HTMLElement[] = []
    const walker = document.createTreeWalker(proseMirror, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_REJECT
        const tag = node.tagName.toLowerCase()
        if (['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'li'].includes(tag)) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_SKIP
      },
    })
    let n: Node | null = walker.nextNode()
    while (n) {
      paragraphs.push(n as HTMLElement)
      n = walker.nextNode()
    }

    let target: HTMLElement | null = null

    // 1. Точное совпадение: параграф содержит text_content
    for (const p of paragraphs) {
      const text = p.textContent ?? ''
      if (text.includes(note.text_content)) {
        target = p
        break
      }
    }

    // 2. Fallback: context_before совпадает
    if (!target && note.context_before) {
      for (const p of paragraphs) {
        const text = p.textContent ?? ''
        if (text.includes(note.context_before)) {
          target = p
          break
        }
      }
    }

    // 3. Fallback: paragraph_index (последний шанс)
    if (!target && note.paragraph_index != null) {
      target = paragraphs[note.paragraph_index]
    }

    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const statusColor = note.status === 'open' ? '#e97316' : note.status === 'resolved' ? '#16a34a' : '#6b7280'
    target.style.transition = 'background-color 0.3s ease-out'
    target.style.backgroundColor = `${statusColor}33`
    setTimeout(() => {
      target.style.backgroundColor = `${statusColor}18`
      setTimeout(() => {
        target.style.backgroundColor = ''
      }, 1500)
    }, 1500)
  }, [])

  const handleContentUpdate = useCallback(() => {
    setContentVersion(v => v + 1)
  }, [])

  async function handlePublish() {
    try {
      await publishChapterAction(chapter.id)
      toast.success('Глава опубликована')
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка публикации')
    }
  }

  async function handleDelete() {
    try {
      await deleteChapterAction(chapter.id)
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 md:px-8 py-3">
          <Link href={`/studio/editions/${editionId}`}>
            <Button variant="ghost" size="icon-sm" className="rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50/50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex flex-1 items-center gap-2">
            <Badge variant="outline" className={`border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-lg ${chapter.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80' : 'bg-amber-50 text-amber-600 border-amber-200/80'}`}>
              {chapter.status === 'published' ? 'Опубликована' : 'Черновик'}
            </Badge>
            <span className="text-sm text-gray-500">
              {saveStatus === 'saving' && <Loader2 className="inline h-3 w-3 animate-spin text-violet-500" />}
              {saveStatus === 'saved' && <Check className="inline h-3 w-3 text-emerald-500" />}
              {saveStatus === 'error' && <AlertCircle className="inline h-3 w-3 text-red-500" />}
              {saveStatus === 'saving' && ' Сохраняю...'}
              {saveStatus === 'saved' && ' Сохранено'}
              {saveStatus === 'error' && ' Ошибка'}
            </span>
          </div>

          <VersionHistory chapterId={chapter.id} />

          {chapter.status !== 'published' && (
            <Button size="sm" onClick={handlePublish} className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-700 hover:to-emerald-600">
              <Globe className="mr-2 h-4 w-4" />
              Опубликовать
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50/50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/80 backdrop-blur-xl border-white/70 rounded-2xl shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">Удалить главу?</AlertDialogTitle>
                <AlertDialogDescription>
                  Глава и все её версии будут удалены. Это необратимо.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 text-white">Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="relative">
            <EditorialNotesOverlay
              editorContainer={editorRef.current}
              notes={editorialNotes}
            />
            <TelegraphEditor
              ref={editorRef}
              chapterId={chapter.id}
              initialTitle={chapter.title}
              initialContent={chapter.content}
              onSaveStatus={setSaveStatus}
              onContentUpdate={handleContentUpdate}
            />
          </div>
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm shadow-black/5 p-4">
              <EditorialNotesPanel
                chapterId={chapter.id}
                onNoteFocus={handleNoteFocus}
                editorialNotes={editorialNotes}
                onNotesUpdate={setEditorialNotes}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}