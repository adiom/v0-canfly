'use client'

import { BookChapter } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ChapterEditorProps {
  chapters: BookChapter[]
  onChange: (chapters: BookChapter[]) => void
}

export function ChapterEditor({ chapters, onChange }: ChapterEditorProps) {
  const addChapter = () => {
    onChange([...chapters, { title: '', content: '' }])
  }

  const removeChapter = (index: number) => {
    onChange(chapters.filter((_, i) => i !== index))
  }

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const next = [...chapters]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    onChange(next)
  }

  const updateChapter = (index: number, field: keyof BookChapter, value: string) => {
    const next = chapters.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch))
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">
          Главы{chapters.length > 0 ? ` (${chapters.length})` : ''}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addChapter}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          + Добавить главу
        </Button>
      </div>

      {chapters.length === 0 && (
        <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-4 text-center text-slate-500 text-sm">
          Глав пока нет. Нажмите «Добавить главу».
        </div>
      )}

      {chapters.map((chapter, index) => (
        <div
          key={index}
          className="rounded-md border border-slate-700 bg-slate-950 p-4 space-y-3"
        >
          {/* Заголовок карточки главы */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-[0.18em]">
              Глава {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveChapter(index, 'up')}
                disabled={index === 0}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Переместить вверх"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveChapter(index, 'down')}
                disabled={index === chapters.length - 1}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Переместить вниз"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeChapter(index)}
                className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                aria-label="Удалить главу"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Заголовок главы */}
          <label className="block space-y-1.5 text-sm text-slate-300">
            <span>Заголовок</span>
            <Input
              value={chapter.title}
              onChange={(e) => updateChapter(index, 'title', e.target.value)}
              maxLength={255}
              placeholder="Название главы"
              className="border-slate-700 bg-slate-900 text-white"
            />
          </label>

          {/* Содержимое главы */}
          <label className="block space-y-1.5 text-sm text-slate-300">
            <span>Содержимое (Markdown)</span>
            <Textarea
              value={chapter.content}
              onChange={(e) => updateChapter(index, 'content', e.target.value)}
              rows={8}
              placeholder="Текст главы в формате Markdown..."
              className="border-slate-700 bg-slate-900 font-mono text-sm text-white"
            />
          </label>
        </div>
      ))}
    </div>
  )
}
