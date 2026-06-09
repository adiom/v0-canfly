'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { sanitizeChapterHtml } from '@/lib/sanitize'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X, AlignJustify, Heart, Quote, MessageCircle, Check, Bookmark, Feather, Globe, Lock, BookmarkPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { Release, Edition, Chapter, ChapterHighlight, ChapterEditorialNote, EditorialNoteStatus } from '@/lib/releases-types'
import type { UserRole } from '@/lib/types'
import { BookmarksPanel } from '@/components/bookmarks-panel'

interface ReleaseBookReaderProps {
  release: Release
  edition: Edition
  chapters: Chapter[]
  currentUserId: string | null
  initialHighlights: ChapterHighlight[]
  userRole: UserRole | null
  userName: string | null
  initialChapterIndex?: number
}

interface SelectionData {
  text: string
  rect: DOMRect
  paragraphIndex: number
  contextBefore: string
  contextAfter: string
}

export function ReleaseBookReader({
  release,
  edition,
  chapters,
  currentUserId,
  initialHighlights,
  userRole,
  userName,
  initialChapterIndex = 0,
}: ReleaseBookReaderProps) {
  const accent = release.design_config?.accent_color ?? '#d52525'
  const bg = release.design_config?.bg_color ?? 'var(--cf-bg)'
  const textColor = release.design_config?.text_color ?? 'var(--cf-text-1)'
  const isEditor = userRole === 'editor' || userRole === 'admin'

  const [currentIndex, setCurrentIndex] = useState(initialChapterIndex)
  const [showToc, setShowToc] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [highlights, setHighlights] = useState<ChapterHighlight[]>(initialHighlights)
  const [editorialNotes, setEditorialNotes] = useState<ChapterEditorialNote[]>([])
  const [selection, setSelection] = useState<SelectionData | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeHighlight, setActiveHighlight] = useState<ChapterHighlight | null>(null)
  const [activeEditorialNote, setActiveEditorialNote] = useState<ChapterEditorialNote | null>(null)
  const [showBookmarks, setShowBookmarks] = useState(false)
  // 'pill' = тулбар над выделением; 'sheet' = раскрытая форма снизу
  const [selectionMode, setSelectionMode] = useState<'pill' | 'sheet'>('pill')
  const [sheetType, setSheetType] = useState<'highlight' | 'editorial'>('highlight')

  const contentRef = useRef<HTMLDivElement>(null)
  const floatingMenuRef = useRef<HTMLDivElement>(null)

  const currentChapter = chapters[currentIndex]
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count ?? 0), 0)
  const readingMinutes = Math.ceil(totalWords / 200)
  const progress = chapters.length > 1 ? (currentIndex / (chapters.length - 1)) * 100 : 100

  // Highlights текущей главы
  const chapterHighlights = useMemo(
    () => highlights.filter(h => h.chapter_id === currentChapter?.id),
    [highlights, currentChapter],
  )

  // Editorial notes текущей главы
  const chapterEditorialNotes = useMemo(
    () => editorialNotes.filter(n => n.chapter_id === currentChapter?.id),
    [editorialNotes, currentChapter],
  )

  // Мои хайлайты (все главы, отсортированные по позиции)
  const myHighlights = useMemo(
    () => currentUserId
      ? highlights
          .filter(h => h.user_id === currentUserId)
          .sort((a, b) => (a.paragraph_index ?? 0) - (b.paragraph_index ?? 0))
      : [],
    [highlights, currentUserId],
  )

  // Подгружаем highlights при смене главы
  useEffect(() => {
    if (!currentChapter) return
    if (highlights.some(h => h.chapter_id === currentChapter.id)) return
    let cancelled = false
    fetch(`/api/chapter-highlights?chapterId=${currentChapter.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.data) return
        setHighlights(prev => {
          const ids = new Set(prev.map(h => h.id))
          return [...prev, ...data.data.filter((h: ChapterHighlight) => !ids.has(h.id))]
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [currentChapter?.id])

  // Подгружаем editorial notes при смене главы (editor/admin)
  useEffect(() => {
    if (!currentChapter || !isEditor) return
    if (editorialNotes.some(n => n.chapter_id === currentChapter.id)) return
    let cancelled = false
    fetch(`/api/chapter-editorial-notes?chapterId=${currentChapter.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.data) return
        setEditorialNotes(prev => {
          const ids = new Set(prev.map(n => n.id))
          return [...prev, ...data.data.filter((n: ChapterEditorialNote) => !ids.has(n.id))]
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [currentChapter?.id, isEditor])

  // Применяем подсветки к DOM после рендера
  useEffect(() => {
    const root = contentRef.current
    if (!root || !currentChapter) return

    let cancelled = false

    // Снимаем старые подсветки (highlights + editorial notes)
    root.querySelectorAll('mark[data-cf-hl], mark[data-cf-en]').forEach(el => {
      const parent = el.parentNode
      if (!parent) return
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      parent.normalize()
    })

    // Собираем параграфы в порядке DOM
    const paragraphs: HTMLElement[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_REJECT
        const tag = node.tagName.toLowerCase()
        if (['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'li'].includes(tag)) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_SKIP
      },
    })
    let node: Node | null = walker.nextNode()
    while (node) {
      paragraphs.push(node as HTMLElement)
      node = walker.nextNode()
    }
    if (cancelled) return

    // Группируем highlights по параграфу
    const hlByParagraph = new Map<number, ChapterHighlight[]>()
    for (const hl of chapterHighlights) {
      if (hl.paragraph_index == null) continue
      const arr = hlByParagraph.get(hl.paragraph_index) ?? []
      arr.push(hl)
      hlByParagraph.set(hl.paragraph_index, arr)
    }

    paragraphs.forEach((p, idx) => {
      const list = hlByParagraph.get(idx)
      if (!list) return
      for (const hl of list) wrapHighlight(p, hl)
    })

    // Группируем editorial notes по параграфу (editor/admin only)
    if (isEditor && chapterEditorialNotes.length > 0) {
      const enByParagraph = new Map<number, ChapterEditorialNote[]>()
      for (const en of chapterEditorialNotes) {
        if (en.paragraph_index == null) continue
        const arr = enByParagraph.get(en.paragraph_index) ?? []
        arr.push(en)
        enByParagraph.set(en.paragraph_index, arr)
      }

      paragraphs.forEach((p, idx) => {
        const list = enByParagraph.get(idx)
        if (!list) return
        for (const en of list) wrapEditorialNote(p, en)
      })
    }

    return () => { cancelled = true }
  }, [currentChapter?.id, chapterHighlights, chapterEditorialNotes, currentIndex, isEditor])

  // Скролл наверх + синхронизация URL при смене главы
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.replaceState(null, '', `/release/${release.slug}/${edition.slug}/${currentIndex + 1}`)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear selection on chapter change
    setSelection(null)
    setSelectionMode('pill')
  }, [currentIndex, release.slug, edition.slug])

  // Клавиатура
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' && currentIndex < chapters.length - 1) setCurrentIndex(i => i + 1)
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, chapters.length])

  // Клик по подсвеченному highlight/editorial note — открываем попап
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName !== 'MARK') return
      if (target.dataset.cfHl) {
        const hlId = target.dataset.cfHl
        const hl = chapterHighlights.find(h => h.id === hlId)
        if (hl) setActiveHighlight(hl)
      } else if (target.dataset.cfEn) {
        const enId = target.dataset.cfEn
        const en = chapterEditorialNotes.find(n => n.id === enId)
        if (en) setActiveEditorialNote(en)
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [chapterHighlights, chapterEditorialNotes])

  const handleMouseUp = useCallback(() => {
    if (floatingMenuRef.current?.contains(document.activeElement)) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const text = sel.toString().trim()
    if (text.length < 3) {
      setSelection(null)
      return
    }
    if (!contentRef.current?.contains(sel.anchorNode)) return

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Находим индекс параграфа
    let node: Node | null = sel.anchorNode
    let paragraphIndex = -1
    let paragraphEl: HTMLElement | null = null
    while (node && node !== contentRef.current) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName.toLowerCase()
        if (['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'li'].includes(tag)) {
          paragraphEl = node
          break
        }
      }
      node = node.parentNode
    }

    if (paragraphEl) {
      const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) => {
          if (!(n instanceof HTMLElement)) return NodeFilter.FILTER_REJECT
          const t = n.tagName.toLowerCase()
          if (['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'li'].includes(t)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_SKIP
        },
      })
      let i = 0
      let n: Node | null = walker.nextNode()
      while (n) {
        if (n === paragraphEl) { paragraphIndex = i; break }
        i++
        n = walker.nextNode()
      }
    }

    const fullText = paragraphEl?.textContent ?? ''
    const offset = fullText.indexOf(text)
    const contextBefore = offset >= 0 ? fullText.slice(Math.max(0, offset - 30), offset) : ''
    const contextAfter = offset >= 0 ? fullText.slice(offset + text.length, offset + text.length + 30) : ''

    setSelection({ text, rect, paragraphIndex, contextBefore, contextAfter })
  }, [])

  const scrollToParagraph = useCallback((paragraphIndex: number) => {
    const root = contentRef.current
    if (!root) return
    const paragraphs = root.querySelectorAll('p')
    const el = paragraphs[paragraphIndex] as HTMLElement | undefined
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('cf-scroll-flash')
    setTimeout(() => el.classList.remove('cf-scroll-flash'), 1800)
  }, [])

  const deleteHighlight = useCallback(async (id: string) => {
    const res = await fetch(`/api/chapter-highlights/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setHighlights(prev => prev.filter(h => h.id !== id))
    }
  }, [])

  const saveHighlight = async () => {
    if (!selection || !currentChapter) return
    if (!currentUserId) {
      toast.error('Войдите чтобы сохранять цитаты')
      return
    }
    setIsSaving(true)
    try {
      if (isEditor) {
        if (!note.trim()) {
          toast.error('Добавьте комментарий к замечанию')
          setIsSaving(false)
          return
        }
        const res = await fetch('/api/chapter-editorial-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapter_id: currentChapter.id,
            text_content: selection.text,
            paragraph_index: selection.paragraphIndex,
            context_before: selection.contextBefore,
            context_after: selection.contextAfter,
            note: note.trim(),
          }),
        })
        const data = await res.json()
        if (res.ok && data.data) {
          setEditorialNotes([data.data, ...editorialNotes])
          toast.success('Замечание отправлено')
          setSelection(null); setSelectionMode('pill')
          setNote('')
          window.getSelection()?.removeAllRanges()
        } else {
          toast.error(data.error ?? 'Ошибка сохранения')
        }
      } else {
        const res = await fetch('/api/chapter-highlights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapter_id: currentChapter.id,
            text_content: selection.text,
            paragraph_index: selection.paragraphIndex,
            context_before: selection.contextBefore,
            context_after: selection.contextAfter,
            note: note || null,
            is_public: isPublic,
          }),
        })
        const data = await res.json()
        if (res.ok && data.data) {
          setHighlights([data.data, ...highlights])
          toast.success(isPublic ? 'Публичная цитата сохранена' : 'Цитата сохранена')
          setSelection(null); setSelectionMode('pill')
          setNote('')
          setIsPublic(false)
          window.getSelection()?.removeAllRanges()
        } else {
          toast.error(data.error ?? 'Ошибка сохранения')
        }
      }
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setIsSaving(false)
    }
  }

  const updateEditorialNoteStatus = async (id: string, status: EditorialNoteStatus) => {
    const res = await fetch(`/api/chapter-editorial-notes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setEditorialNotes(editorialNotes.map(n =>
        n.id === id ? data.data : n,
      ))
      if (activeEditorialNote?.id === id) {
        setActiveEditorialNote(data.data)
      }
      toast.success(status === 'resolved' ? 'Замечание решено' : 'Замечание проигнорировано')
    } else {
      toast.error('Ошибка')
    }
  }

  const toggleLike = async (id: string) => {
    if (!currentUserId) {
      toast.error('Войдите чтобы ставить лайки')
      return
    }
    const res = await fetch(`/api/chapter-highlights/${id}/like`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setHighlights(highlights.map(h =>
        h.id === id ? { ...h, is_liked_by_me: data.data.liked, likes_count: data.data.likes_count } : h,
      ))
      if (activeHighlight?.id === id) {
        setActiveHighlight({ ...activeHighlight, is_liked_by_me: data.data.liked, likes_count: data.data.likes_count })
      }
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cf-bg">
        <p className="text-cf-text-4 text-sm">Содержимое ещё не опубликовано</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: textColor }}>
      {/* Прогресс-бар */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ backgroundColor: `${accent}22` }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: accent }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0.5 z-40 border-b backdrop-blur-xl"
        style={{ borderColor: `${textColor}12`, backgroundColor: `${bg}ee` }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 md:px-8">
          <Link
            href={`/release/${release.slug}`}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: textColor }}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline truncate max-w-[160px]">{release.title}</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(s => Math.max(14, s - 2))}
              className="px-2 py-1.5 text-xs font-black transition-opacity hover:opacity-60"
              style={{ color: textColor }}
              aria-label="Уменьшить шрифт"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(s => Math.min(26, s + 2))}
              className="px-2 py-1.5 text-sm font-black transition-opacity hover:opacity-60"
              style={{ color: textColor }}
              aria-label="Увеличить шрифт"
            >
              A+
            </button>
            {chapters.length > 1 && (
              <button
                onClick={() => setShowToc(true)}
                className="ml-1 p-2 transition-opacity hover:opacity-60"
                style={{ color: textColor }}
                aria-label="Оглавление"
              >
                <AlignJustify className="h-4 w-4" />
              </button>
            )}
            {currentUserId && (
              <button
                onClick={() => setShowBookmarks(b => !b)}
                className="relative ml-1 p-2 transition-opacity hover:opacity-60"
                style={{ color: showBookmarks ? accent : textColor }}
                aria-label="Мои закладки"
              >
                <Bookmark className="h-4 w-4" style={{ fill: myHighlights.length > 0 ? 'currentColor' : 'none' }} />
                {myHighlights.length > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black leading-none"
                    style={{ backgroundColor: accent, color: '#fff' }}
                  >
                    {myHighlights.length > 9 ? '9+' : myHighlights.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-10">
          {chapters.length > 1 && (
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em]" style={{ color: accent }}>
              {currentIndex === 0 && release.genre ? release.genre : `Глава ${currentIndex + 1}`}
            </p>
          )}
          <h1 className="text-3xl font-black uppercase leading-none md:text-4xl" style={{ color: textColor }}>
            {currentChapter.title}
          </h1>
          {currentIndex === 0 && release.annotation && (
            <p className="mt-5 text-base leading-7 opacity-60" style={{ color: textColor }}>
              {release.annotation}
            </p>
          )}
          {currentIndex === 0 && (
            <div className="mt-4 flex items-center gap-4">
              {release.authors.length > 0 && (
                <span className="text-xs opacity-50" style={{ color: textColor }}>
                  {release.authors.map(a => a.name).join(', ')}
                </span>
              )}
              {totalWords > 0 && (
                <span className="text-xs opacity-40" style={{ color: textColor }}>
                  ~{readingMinutes} мин чтения
                </span>
              )}
            </div>
          )}
          <div className="mt-8 h-px w-16 opacity-20" style={{ backgroundColor: textColor }} />
        </div>

        {/* Текст главы */}
        {currentChapter.content ? (
          <div
            ref={contentRef}
            onMouseUp={handleMouseUp}
            className="prose max-w-none leading-8"
            style={{
              fontSize: `${fontSize}px`,
              color: textColor,
              ['--tw-prose-body' as string]: textColor,
              ['--tw-prose-headings' as string]: textColor,
              ['--tw-prose-links' as string]: accent,
              ['--tw-prose-bold' as string]: textColor,
              ['--tw-prose-quotes' as string]: textColor,
              ['--tw-prose-hr' as string]: `${textColor}20`,
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeChapterHtml(currentChapter.content) }}
          />
        ) : (
          <p className="opacity-40 py-16 text-center text-sm" style={{ color: textColor }}>
            Содержимое главы ещё не добавлено
          </p>
        )}

        {/* Навигация prev/next */}
        <div className="mt-20 flex items-stretch gap-3">
          {currentIndex > 0 ? (
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              className="group flex flex-1 items-center gap-3 border py-4 px-5 text-left transition-colors"
              style={{ borderColor: `${textColor}14` }}
            >
              <ChevronLeft className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: textColor }} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-40 mb-1" style={{ color: textColor }}>Назад</p>
                <p className="truncate text-sm font-bold" style={{ color: textColor }}>{chapters[currentIndex - 1].title}</p>
              </div>
            </button>
          ) : <div className="flex-1" />}

          {currentIndex < chapters.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="group flex flex-1 items-center justify-end gap-3 border py-4 px-5 text-right transition-colors"
              style={{ borderColor: `${textColor}14` }}
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-40 mb-1" style={{ color: textColor }}>Далее</p>
                <p className="truncate text-sm font-bold" style={{ color: textColor }}>{chapters[currentIndex + 1].title}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: textColor }} />
            </button>
          ) : (
            <div className="flex flex-1 flex-col items-end justify-center gap-2 border py-4 px-5" style={{ borderColor: `${textColor}14` }}>
              <p className="text-[10px] uppercase tracking-[0.16em] opacity-40" style={{ color: textColor }}>Конец</p>
              <Link
                href="/releases"
                className="text-sm font-black uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
                style={{ color: accent }}
              >
                Все релизы →
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* === PHASE 1: Pill toolbar above selection === */}
      {selection && selectionMode === 'pill' && (
        <div
          ref={floatingMenuRef}
          className="fixed z-[100] flex items-center overflow-hidden rounded-full shadow-2xl"
          style={{
            top: Math.max(60, selection.rect.top + window.scrollY - 52),
            left: Math.max(8, Math.min(window.innerWidth - 200, selection.rect.left + selection.rect.width / 2 - 96)),
            backgroundColor: '#0e0d0c',
            border: '1px solid rgba(244,239,229,0.12)',
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {/* Метка цитаты */}
          <span
            className="pl-4 pr-2 font-[family-name:var(--font-cormorant)] text-[13px] italic opacity-50 select-none"
            style={{ color: '#f4efe5' }}
          >
            {selection.text.length > 28 ? selection.text.slice(0, 28) + '…' : selection.text}
          </span>

          {/* Разделитель */}
          <span className="h-5 w-px" style={{ backgroundColor: 'rgba(244,239,229,0.12)' }} />

          {/* Кнопка: сохранить цитату */}
          <button
            onClick={() => { setSheetType('highlight'); setSelectionMode('sheet') }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors hover:bg-white/5"
            style={{ color: accent }}
            title="Сохранить цитату"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Цитата</span>
          </button>

          {/* Кнопка: редакторское замечание (только editor/admin) */}
          {isEditor && (
            <>
              <span className="h-5 w-px" style={{ backgroundColor: 'rgba(244,239,229,0.12)' }} />
              <button
                onClick={() => { setSheetType('editorial'); setSelectionMode('sheet') }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors hover:bg-white/5"
                style={{ color: '#e97316' }}
                title="Редакторское замечание"
              >
                <Feather className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Замечание</span>
              </button>
            </>
          )}

          {/* Закрыть */}
          <span className="h-5 w-px" style={{ backgroundColor: 'rgba(244,239,229,0.12)' }} />
          <button
            onClick={() => { setSelection(null); window.getSelection()?.removeAllRanges() }}
            className="flex items-center justify-center px-3 py-2.5 opacity-40 transition-opacity hover:opacity-80"
            style={{ color: '#f4efe5' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* === PHASE 2: Bottom sheet === */}
      {selection && selectionMode === 'sheet' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99]"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setSelection(null); setSelectionMode('pill'); setNote(''); setIsPublic(false); window.getSelection()?.removeAllRanges() }}
          />

          {/* Sheet */}
          <div
            ref={floatingMenuRef}
            className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col"
            style={{
              backgroundColor: bg,
              borderTop: `2px solid ${sheetType === 'editorial' ? '#e97316' : accent}`,
              borderRadius: '16px 16px 0 0',
              maxHeight: '80vh',
              boxShadow: '0 -24px 60px rgba(0,0,0,0.5)',
              animation: 'cf-sheet-up 0.28s cubic-bezier(0.32,0.72,0,1)',
            }}
            onMouseDown={e => { if ((e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault() }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: `${textColor}20` }} />
            </div>

            <div className="overflow-y-auto px-6 pb-8 pt-2">
              {/* Заголовок */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sheetType === 'editorial' ? (
                    <Feather className="h-4 w-4" style={{ color: '#e97316' }} />
                  ) : (
                    <Quote className="h-4 w-4" style={{ color: accent }} />
                  )}
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.22em]"
                    style={{ color: sheetType === 'editorial' ? '#e97316' : accent }}
                  >
                    {sheetType === 'editorial' ? 'Замечание редактора' : 'Новая цитата'}
                  </span>
                </div>
                <button
                  onClick={() => { setSelection(null); setSelectionMode('pill'); setNote(''); setIsPublic(false); window.getSelection()?.removeAllRanges() }}
                  className="p-1 opacity-30 transition-opacity hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Выделенный текст */}
              <div
                className="mb-5 rounded-sm px-4 py-3"
                style={{ backgroundColor: `${sheetType === 'editorial' ? '#e97316' : accent}0f`, borderLeft: `3px solid ${sheetType === 'editorial' ? '#e97316' : accent}50` }}
              >
                <p
                  className="font-[family-name:var(--font-cormorant)] text-[18px] italic leading-snug line-clamp-5"
                  style={{ color: textColor }}
                >
                  «{selection.text}»
                </p>
              </div>

              {currentUserId ? (
                <>
                  {/* Поле заметки */}
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={sheetType === 'editorial' ? 'Что нужно исправить (обязательно)' : 'Личная заметка (опционально)'}
                    rows={3}
                    autoFocus
                    className="w-full resize-none bg-transparent text-sm leading-7 outline-none placeholder:opacity-30"
                    style={{
                      color: textColor,
                      borderBottom: `1px solid ${textColor}18`,
                      paddingBottom: '8px',
                      marginBottom: '20px',
                    }}
                  />

                  {/* Тоггл публичности — только для цитат */}
                  {sheetType === 'highlight' && (
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={() => setIsPublic(p => !p)}
                        className="flex w-full items-center justify-between rounded-sm px-4 py-3 transition-colors"
                        style={{ backgroundColor: `${textColor}07` }}
                      >
                        <div className="flex items-center gap-3">
                          {isPublic ? (
                            <Globe className="h-4 w-4" style={{ color: accent }} />
                          ) : (
                            <Lock className="h-4 w-4" style={{ color: `${textColor}50` }} />
                          )}
                          <div className="text-left">
                            <p className="text-sm font-semibold" style={{ color: isPublic ? textColor : `${textColor}70` }}>
                              {isPublic ? 'Публичная цитата' : 'Только для меня'}
                            </p>
                            <p className="text-[11px] opacity-40" style={{ color: textColor }}>
                              {isPublic ? 'Видна всем читателям на странице книги' : 'Видна только вам в закладках'}
                            </p>
                          </div>
                        </div>
                        {/* Переключатель-таблетка */}
                        <div
                          className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200"
                          style={{ backgroundColor: isPublic ? accent : `${textColor}20` }}
                        >
                          <span
                            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                            style={{ left: isPublic ? '24px' : '4px' }}
                          />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Кнопка сохранения */}
                  <button
                    onClick={saveHighlight}
                    disabled={isSaving || (sheetType === 'editorial' && !note.trim())}
                    className="flex w-full items-center justify-center gap-2 py-4 text-sm font-black uppercase tracking-[0.14em] transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: sheetType === 'editorial' ? '#e97316' : accent, color: '#fff', borderRadius: '4px' }}
                  >
                    {isSaving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Сохраняем…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {sheetType === 'editorial' ? 'Отправить замечание' : 'Сохранить цитату'}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <Link
                  href={`/login?redirect=/release/${release.slug}`}
                  className="flex w-full items-center justify-center py-4 text-sm font-black uppercase tracking-[0.14em]"
                  style={{ backgroundColor: accent, color: '#fff', borderRadius: '4px' }}
                >
                  Войти, чтобы сохранить
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Highlight detail popup */}
      {activeHighlight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveHighlight(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative max-w-md w-full border p-6 shadow-2xl"
            style={{ backgroundColor: bg, borderColor: `${textColor}18`, color: textColor }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveHighlight(null)}
              className="absolute top-3 right-3 p-1 opacity-40 hover:opacity-100"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              {activeHighlight.user_avatar ? (
                <img src={activeHighlight.user_avatar} alt={activeHighlight.user_name ?? ''} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}33`, color: accent }}>
                  <span className="font-black text-sm">{(activeHighlight.user_name ?? '?')[0]}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{activeHighlight.user_name ?? 'Аноним'}</p>
                <p className="text-[10px] opacity-50">
                  {new Date(activeHighlight.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <blockquote
              className="text-sm leading-relaxed italic border-l-2 pl-3 opacity-80"
              style={{ borderColor: accent }}
            >
              «{activeHighlight.text_content}»
            </blockquote>

            {activeHighlight.note && (
              <p className="mt-4 text-sm leading-relaxed">{activeHighlight.note}</p>
            )}

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleLike(activeHighlight.id)}
                className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                <Heart
                  className="h-3.5 w-3.5"
                  style={activeHighlight.is_liked_by_me ? { fill: accent, color: accent } : undefined}
                />
                <span>{activeHighlight.likes_count}</span>
              </button>

              <Link
                href={`/release/${release.slug}/highlight/${activeHighlight.id}`}
                className="text-[10px] uppercase tracking-[0.16em] opacity-50 hover:opacity-100"
                style={{ color: accent }}
              >
                Поделиться
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Editorial note detail popup */}
      {activeEditorialNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveEditorialNote(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative max-w-md w-full border p-6 shadow-2xl"
            style={{ backgroundColor: bg, borderColor: '#e9731640', color: textColor }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveEditorialNote(null)}
              className="absolute top-3 right-3 p-1 opacity-40 hover:opacity-100"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4" style={{ color: '#e97316' }} />
              <span className="text-[10px] uppercase tracking-[0.16em] font-black" style={{ color: '#e97316' }}>
                {activeEditorialNote.status === 'open' ? 'Открытое замечание' :
                 activeEditorialNote.status === 'resolved' ? 'Решённое замечание' :
                 'Проигнорированное замечание'}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {activeEditorialNote.author_avatar ? (
                <img src={activeEditorialNote.author_avatar} alt={activeEditorialNote.author_name ?? ''} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e9731633', color: '#e97316' }}>
                  <span className="font-black text-sm">{(activeEditorialNote.author_name ?? '?')[0]}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{activeEditorialNote.author_name ?? 'Редактор'}</p>
                <p className="text-[10px] opacity-50">
                  {new Date(activeEditorialNote.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <blockquote
              className="text-sm leading-relaxed italic border-l-2 pl-3 opacity-80"
              style={{ borderColor: '#e97316' }}
            >
              «{activeEditorialNote.text_content}»
            </blockquote>

            <p className="mt-4 text-sm leading-relaxed">{activeEditorialNote.note}</p>

            {isEditor && activeEditorialNote.status === 'open' && (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => updateEditorialNoteStatus(activeEditorialNote.id, 'resolved')}
                  className="flex-1 h-8 text-xs font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#16a34a', color: bg }}
                >
                  <Check className="h-3 w-3" /> Решено
                </button>
                <button
                  onClick={() => updateEditorialNoteStatus(activeEditorialNote.id, 'ignored')}
                  className="flex-1 h-8 text-xs border transition-opacity hover:opacity-60"
                  style={{ borderColor: `${textColor}20` }}
                >
                  Игнорировать
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Оглавление */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowToc(false)} />
          <aside
            className="flex w-72 flex-col border-l"
            style={{ backgroundColor: bg, borderColor: `${textColor}12` }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-4"
              style={{ borderColor: `${textColor}12` }}
            >
              <h2 className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: textColor }}>
                Оглавление
              </h2>
              <button
                onClick={() => setShowToc(false)}
                className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: textColor }}
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => { setCurrentIndex(i); setShowToc(false) }}
                  className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: `${textColor}08`,
                    backgroundColor: i === currentIndex ? `${accent}10` : 'transparent',
                  }}
                >
                  <span
                    className="mt-0.5 min-w-[20px] text-xs font-black tabular-nums"
                    style={{ color: i === currentIndex ? accent : `${textColor}40` }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color: i === currentIndex ? textColor : `${textColor}70`,
                        fontWeight: i === currentIndex ? 700 : 400,
                      }}
                    >
                      {ch.title}
                    </p>
                    {ch.word_count > 0 && (
                      <p className="mt-0.5 text-[10px] opacity-30" style={{ color: textColor }}>
                        {ch.word_count.toLocaleString('ru-RU')} слов
                      </p>
                    )}
                  </div>
                </button>
              ))}
              <Link
                href={`/release/${release.slug}/${edition.slug}/full`}
                onClick={() => setShowToc(false)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{ color: accent }}
              >
                <Quote className="h-4 w-4" />
                Читать одним файлом
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Bookmarks panel */}
      {currentUserId && (
        <BookmarksPanel
          open={showBookmarks}
          onClose={() => setShowBookmarks(false)}
          highlights={myHighlights}
          currentChapterId={currentChapter?.id ?? ''}
          onDelete={deleteHighlight}
          onScrollTo={scrollToParagraph}
          accent={accent}
          bg={bg}
          textColor={textColor}
        />
      )}
    </div>
  )
}

// Обёртывает найденный текст в <mark>
function wrapHighlight(paragraph: HTMLElement, hl: ChapterHighlight) {
  const text = hl.text_content
  if (!text) return

  // Собираем все текстовые узлы
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT, null)
  const textNodes: Text[] = []
  let n: Node | null = walker.nextNode()
  while (n) {
    textNodes.push(n as Text)
    n = walker.nextNode()
  }

  // Ищем точное совпадение или с учётом контекста
  for (const node of textNodes) {
    if (node.parentElement?.tagName === 'MARK') continue
    const nodeText = node.textContent ?? ''
    let idx = nodeText.indexOf(text)
    if (idx === -1 && hl.context_before) {
      // Пробуем найти с контекстом
      const foundAt = nodeText.indexOf(hl.context_before)
      if (foundAt >= 0) {
        const tail = nodeText.slice(foundAt + hl.context_before.length, foundAt + hl.context_before.length + text.length + 10)
        if (tail.startsWith(text.slice(0, 20))) {
          idx = foundAt + hl.context_before.length
        }
      }
    }
    if (idx === -1) continue

    try {
      const range = document.createRange()
      range.setStart(node, idx)
      range.setEnd(node, idx + text.length)
      const mark = document.createElement('mark')
      mark.dataset.cfHl = hl.id
      mark.dataset.cfMine = hl.user_id === hl.user_id && !hl.is_public ? 'true' : ''

      // Стили
      mark.style.backgroundColor = hl.is_public ? `${hl.user_id}25` : `${accent_for_hl(hl)}44`
      mark.style.cursor = 'pointer'
      mark.style.borderRadius = '2px'
      mark.style.padding = '0 1px'
      mark.style.transition = 'background-color 0.15s'
      mark.addEventListener('mouseenter', () => { mark.style.backgroundColor = `${accent_for_hl(hl)}88` })
      mark.addEventListener('mouseleave', () => { mark.style.backgroundColor = hl.is_public ? `${hl.user_id}25` : `${accent_for_hl(hl)}44` })

      range.surroundContents(mark)
      return // один highlight за раз
    } catch {
      // не получилось окружить — пропускаем
    }
  }
}

function wrapEditorialNote(paragraph: HTMLElement, en: ChapterEditorialNote) {
  const text = en.text_content
  if (!text) return

  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT, null)
  const textNodes: Text[] = []
  let n: Node | null = walker.nextNode()
  while (n) {
    textNodes.push(n as Text)
    n = walker.nextNode()
  }

  for (const node of textNodes) {
    if (node.parentElement?.tagName === 'MARK') continue
    const nodeText = node.textContent ?? ''
    let idx = nodeText.indexOf(text)
    if (idx === -1 && en.context_before) {
      const foundAt = nodeText.indexOf(en.context_before)
      if (foundAt >= 0) {
        const tail = nodeText.slice(foundAt + en.context_before.length, foundAt + en.context_before.length + text.length + 10)
        if (tail.startsWith(text.slice(0, 20))) {
          idx = foundAt + en.context_before.length
        }
      }
    }
    if (idx === -1) continue

    try {
      const range = document.createRange()
      range.setStart(node, idx)
      range.setEnd(node, idx + text.length)
      const mark = document.createElement('mark')
      mark.dataset.cfEn = en.id

      const statusColor = en.status === 'open' ? '#e97316' : en.status === 'resolved' ? '#16a34a' : '#6b7280'
      const bgOpacity = en.status === 'open' ? '44' : en.status === 'resolved' ? '28' : '18'
      mark.style.backgroundColor = `${statusColor}${bgOpacity}`
      mark.style.cursor = 'pointer'
      mark.style.borderRadius = '2px'
      mark.style.padding = '0 1px'
      mark.style.transition = 'background-color 0.15s'
      mark.addEventListener('mouseenter', () => { mark.style.backgroundColor = `${statusColor}88` })
      mark.addEventListener('mouseleave', () => { mark.style.backgroundColor = `${statusColor}${bgOpacity}` })

      range.surroundContents(mark)
      return
    } catch {
      // skip
    }
  }
}

function accent_for_hl(hl: ChapterHighlight): string {
  // Простой детерминированный цвет по user_id для приватных
  if (!hl.is_public) return '#d52525'
  return '#d52525'
}
