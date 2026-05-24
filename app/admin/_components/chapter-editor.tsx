'use client'

import { useState } from 'react'
import { BookChapter } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ChapterEditorProps {
  chapters: BookChapter[]
  onChange: (chapters: BookChapter[]) => void
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export function ChapterEditor({ chapters, onChange }: ChapterEditorProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(chapters.length > 0 ? 0 : null)

  const addChapter = () => {
    const next = [...chapters, { title: '', content: '' }]
    onChange(next)
    setActiveIndex(next.length - 1)
  }

  const removeChapter = (index: number) => {
    const next = chapters.filter((_, i) => i !== index)
    onChange(next)
    setActiveIndex((current) => {
      if (current === null) return null
      if (next.length === 0) return null
      if (current >= next.length) return next.length - 1
      return current
    })
  }

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const next = [...chapters]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    onChange(next)
    setActiveIndex(swapIndex)
  }

  const updateChapter = (index: number, field: keyof BookChapter, value: string) => {
    onChange(chapters.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch)))
  }

  const toggle = (index: number) => {
    setActiveIndex((current) => (current === index ? null : index))
  }

  return (
    <div className="space-y-2">
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
        <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-4 text-center text-sm text-slate-500">
          Глав пока нет. Нажмите «Добавить главу».
        </div>
      )}

      <div className="rounded-md border border-slate-700 bg-slate-950 overflow-hidden">
        {chapters.map((chapter, index) => {
          const isOpen = activeIndex === index
          const label = chapter.title.trim() || `Глава ${index + 1}`
          const words = wordCount(chapter.content)

          return (
            <div key={index} className={index > 0 ? 'border-t border-slate-800' : ''}>
              {/* Row */}
              <div className="flex items-center gap-1 px-3 py-2.5 hover:bg-slate-900 transition-colors">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`text-xs transition-transform duration-150 ${isOpen ? 'rotate-90' : ''} text-slate-500`}
                  >
                    ▶
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{label}</span>
                  {words > 0 && (
                    <span className="shrink-0 text-xs text-slate-500">{words} сл.</span>
                  )}
                </button>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveChapter(index, 'up')}
                    disabled={index === 0}
                    className="px-1.5 py-1 text-xs text-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 transition-colors"
                    aria-label="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveChapter(index, 'down')}
                    disabled={index === chapters.length - 1}
                    className="px-1.5 py-1 text-xs text-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 transition-colors"
                    aria-label="Переместить вниз"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeChapter(index)}
                    className="px-1.5 py-1 text-xs text-red-500 hover:text-red-300 transition-colors"
                    aria-label="Удалить главу"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-slate-800 bg-slate-900/50 px-4 py-4 space-y-3">
                  <label className="block space-y-1.5 text-sm text-slate-300">
                    <span>Заголовок</span>
                    <Input
                      value={chapter.title}
                      onChange={(e) => updateChapter(index, 'title', e.target.value)}
                      maxLength={255}
                      placeholder="Название главы"
                      className="border-slate-700 bg-slate-950 text-white"
                      autoFocus
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm text-slate-300">
                    <span>Содержимое (Markdown)</span>
                    <Textarea
                      value={chapter.content}
                      onChange={(e) => updateChapter(index, 'content', e.target.value)}
                      rows={12}
                      placeholder="Текст главы в формате Markdown..."
                      className="border-slate-700 bg-slate-950 font-mono text-sm text-white"
                    />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
