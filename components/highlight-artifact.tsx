'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Globe, Lock, Check, RotateCcw, Loader2, ImageOff, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { ChapterHighlight } from '@/lib/releases-types'

type Tab = 'cite' | 'explain' | 'rewrite' | 'meaning' | 'illustrate'
type RewriteMode = 'другой-финал' | 'другая-эпоха' | 'другой-стиль'

interface HighlightArtifactProps {
  open: boolean
  text: string
  chapterTitle: string
  anchorRect: DOMRect | null
  releaseSlug: string
  chapterId: string
  paragraphIndex: number
  contextBefore: string
  contextAfter: string
  currentUserId: string | null
  onSaved: (highlight: ChapterHighlight) => void
  onClose: () => void
  accent: string
  bg: string
  textColor: string
  isEditor: boolean
  onSaveEditorial: (note: string) => Promise<void>
}

// Генерирует HSL-тинт из первых 6 символов UUID
function uuidToHsl(id: string): string {
  let hash = 0
  for (let i = 0; i < Math.min(id.length, 6); i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff
  }
  const hue = hash % 360
  return `hsl(${hue}, 25%, 10%)`
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'cite',       label: 'ЦИТАТА',   emoji: '✦' },
  { id: 'explain',    label: 'ОБЪЯСНИ',  emoji: '◈' },
  { id: 'rewrite',    label: 'ПЕРЕПИШИ', emoji: '✍' },
  { id: 'meaning',    label: 'СМЫСЛ',    emoji: '◉' },
  { id: 'illustrate', label: 'НАРИСУЙ',  emoji: '◇' },
]

const REWRITE_MODES: { id: RewriteMode; label: string }[] = [
  { id: 'другой-финал', label: 'другой финал' },
  { id: 'другая-эпоха', label: 'другая эпоха' },
  { id: 'другой-стиль', label: 'другой стиль' },
]

export function HighlightArtifact({
  open,
  text,
  chapterTitle,
  anchorRect,
  releaseSlug,
  chapterId,
  paragraphIndex,
  contextBefore,
  contextAfter,
  currentUserId,
  onSaved,
  onClose,
  accent,
  bg,
  textColor,
  isEditor,
  onSaveEditorial,
}: HighlightArtifactProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cite')
  const [note, setNote] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editorialNote, setEditorialNote] = useState('')

  // AI streaming state
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [rewriteMode, setRewriteMode] = useState<RewriteMode | null>(null)

  // Illustration
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')

  const cardRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Временный ID для UUID-эффекта до сохранения
  const tempId = useRef(Math.random().toString(16).slice(2, 14))
  const tintColor = uuidToHsl(tempId.current)
  const shortId = tempId.current.slice(0, 6).toUpperCase()

  // Сбрасываем AI при смене вкладки
  useEffect(() => {
    abortRef.current?.abort()
    setAiText('')
    setAiLoading(false)
    setAiError('')
    setRewriteMode(null)
    setImageUrl(null)
    setImageLoading(false)
    setImageError('')
    setImagePrompt('')
  }, [activeTab])

  // Сбрасываем всё при закрытии
  useEffect(() => {
    if (!open) {
      setActiveTab('cite')
      setNote('')
      setIsPublic(false)
      setEditorialNote('')
      setAiText('')
      setAiLoading(false)
      setAiError('')
      setRewriteMode(null)
      setImageUrl(null)
      setImageLoading(false)
      setImageError('')
      abortRef.current?.abort()
      tempId.current = Math.random().toString(16).slice(2, 14)
    }
  }, [open])

  const streamAI = useCallback(async (endpoint: string, body: object) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setAiLoading(true)
    setAiText('')
    setAiError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        setAiError('Ошибка запроса'); setAiLoading(false); return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAiText(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== 'AbortError') setAiError('Ошибка сети')
    } finally {
      setAiLoading(false)
    }
  }, [])

  const handleExplain = () => streamAI('/api/highlights/explain', { text })
  const handleMeaning = () => streamAI('/api/highlights/meaning', { text })
  const handleRewrite = (mode: RewriteMode) => {
    setRewriteMode(mode)
    streamAI('/api/highlights/rewrite', { text, mode })
  }

  const handleIllustrate = async () => {
    setImageLoading(true)
    setImageError('')
    setImageUrl(null)
    try {
      const res = await fetch('/api/highlights/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json() as { imageUrl?: string; prompt?: string; error?: string }
      if (!res.ok || data.error) {
        setImageError(data.error === 'unavailable' ? 'Функция пока недоступна' : 'Не удалось сгенерировать')
      } else {
        setImageUrl(data.imageUrl ?? null)
        setImagePrompt(data.prompt ?? '')
      }
    } catch {
      setImageError('Ошибка сети')
    } finally {
      setImageLoading(false)
    }
  }

  const saveCite = async () => {
    if (!currentUserId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/chapter-highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          text_content: text,
          paragraph_index: paragraphIndex,
          context_before: contextBefore,
          context_after: contextAfter,
          note: note.trim() || null,
          is_public: isPublic,
        }),
      })
      const data = await res.json() as { data?: ChapterHighlight; error?: string }
      if (res.ok && data.data) {
        onSaved(data.data)
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const saveEditorialNote = async () => {
    if (!editorialNote.trim()) return
    setIsSaving(true)
    try {
      await onSaveEditorial(editorialNote.trim())
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  // Позиционирование карточки относительно anchorRect
  const getPosition = (): React.CSSProperties => {
    if (!anchorRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    const cardW = 300
    const cardH = 420
    const margin = 12
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = anchorRect.top + window.scrollY - cardH - margin
    if (top < margin) top = anchorRect.bottom + window.scrollY + margin

    let left = anchorRect.left + anchorRect.width / 2 - cardW / 2
    left = Math.max(margin, Math.min(vw - cardW - margin, left))

    // На мобайле — снизу по центру
    if (vw < 640) {
      return {
        bottom: 0,
        left: 0,
        right: 0,
        top: 'auto',
        borderRadius: '16px 16px 0 0',
        maxHeight: '75vh',
      }
    }

    // Если не помещается вверху — под выделением
    const finalTop = Math.max(margin + 40, Math.min(vh - cardH - margin + window.scrollY, top))

    return { top: finalTop, left }
  }

  if (!open) return null

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const pos = getPosition()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[98]"
        style={{ background: 'rgba(0,0,0,0.38)' }}
        onClick={onClose}
      />

      {/* Карточка */}
      <div
        ref={cardRef}
        className="fixed z-[99] flex flex-col overflow-hidden"
        style={{
          ...pos,
          width: isMobile ? undefined : '300px',
          background: bg,
          backgroundImage: `radial-gradient(ellipse at top left, ${tintColor} 0%, transparent 70%)`,
          border: `1px dashed ${textColor}20`,
          borderRadius: pos.borderRadius ?? '6px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)',
          animation: isMobile ? undefined : 'cf-artifact-in 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
          maxHeight: isMobile ? '75vh' : '480px',
        }}
        onMouseDown={e => { if ((e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault() }}
      >
        {/* Шапка: ID + глава + закрыть */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-2.5"
          style={{ borderBottom: `1px solid ${textColor}0f`, backgroundColor: `${textColor}06` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] tracking-wider opacity-40"
              style={{ color: textColor }}
            >
              #{shortId}
            </span>
            <span className="h-3 w-px" style={{ backgroundColor: `${textColor}20` }} />
            <span
              className="max-w-[130px] truncate text-[10px] uppercase tracking-[0.14em] opacity-35"
              style={{ color: textColor }}
            >
              {chapterTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full opacity-30 transition-opacity hover:opacity-80"
            style={{ color: textColor }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Цитата */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderBottom: `1px solid ${textColor}0a` }}
        >
          <p
            className="font-[family-name:var(--font-cormorant)] text-[15px] italic leading-snug line-clamp-3 opacity-85"
            style={{ color: textColor }}
          >
            «{text.length > 160 ? text.slice(0, 160) + '…' : text}»
          </p>
        </div>

        {/* Tab strip */}
        <div
          className="flex shrink-0 overflow-x-auto"
          style={{ borderBottom: `1px solid ${textColor}0f` }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex shrink-0 flex-col items-center gap-0.5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] transition-colors"
              style={{
                color: activeTab === tab.id ? accent : `${textColor}40`,
                borderBottom: activeTab === tab.id ? `2px solid ${accent}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <span className="text-[11px]">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Контент вкладки */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* === ЦИТАТА === */}
          {activeTab === 'cite' && (
            <div className="flex flex-col gap-4">
              {currentUserId ? (
                <>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Личная заметка (опционально)"
                    className="w-full bg-transparent text-sm outline-none placeholder:opacity-25"
                    style={{
                      color: textColor,
                      borderBottom: `1px solid ${textColor}18`,
                      paddingBottom: '8px',
                    }}
                  />

                  {/* Публичность */}
                  <button
                    type="button"
                    onClick={() => setIsPublic(p => !p)}
                    className="flex items-center justify-between rounded-sm px-3 py-2 text-xs transition-colors"
                    style={{ backgroundColor: `${textColor}07` }}
                  >
                    <div className="flex items-center gap-2" style={{ color: isPublic ? textColor : `${textColor}55` }}>
                      {isPublic
                        ? <Globe className="h-3.5 w-3.5" style={{ color: accent }} />
                        : <Lock className="h-3.5 w-3.5" />}
                      <span>{isPublic ? 'Публичная цитата' : 'Только для меня'}</span>
                    </div>
                    <div
                      className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                      style={{ backgroundColor: isPublic ? accent : `${textColor}20` }}
                    >
                      <span
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                        style={{ left: isPublic ? '20px' : '2px' }}
                      />
                    </div>
                  </button>

                  {/* Если редактор — доп. поле замечания */}
                  {isEditor && (
                    <div className="border-t pt-3" style={{ borderColor: `${textColor}0f` }}>
                      <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] opacity-40" style={{ color: '#e97316' }}>
                        Замечание редактора
                      </p>
                      <textarea
                        value={editorialNote}
                        onChange={e => setEditorialNote(e.target.value)}
                        placeholder="Что нужно исправить (обязательно)"
                        rows={2}
                        className="w-full resize-none bg-transparent text-xs leading-6 outline-none placeholder:opacity-25"
                        style={{
                          color: textColor,
                          borderBottom: `1px solid #e9731630`,
                          paddingBottom: '6px',
                        }}
                      />
                      <button
                        onClick={saveEditorialNote}
                        disabled={isSaving || !editorialNote.trim()}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-opacity disabled:opacity-30"
                        style={{ backgroundColor: '#e97316', color: '#fff', borderRadius: '3px' }}
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Отправить замечание
                      </button>
                    </div>
                  )}

                  <button
                    onClick={saveCite}
                    disabled={isSaving}
                    className="flex w-full items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-[0.14em] transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: accent, color: '#fff', borderRadius: '3px' }}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {isSaving ? 'Сохраняем…' : 'Сохранить артефакт'}
                  </button>
                </>
              ) : (
                <Link
                  href={`/login?redirect=/release/${releaseSlug}`}
                  onClick={onClose}
                  className="flex w-full items-center justify-center py-3 text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ backgroundColor: accent, color: '#fff', borderRadius: '3px' }}
                >
                  Войти, чтобы сохранить
                </Link>
              )}
            </div>
          )}

          {/* === ОБЪЯСНИ === */}
          {activeTab === 'explain' && (
            <AiPanel
              aiText={aiText}
              aiLoading={aiLoading}
              aiError={aiError}
              onStart={handleExplain}
              onRetry={handleExplain}
              startLabel="Объяснить"
              accent={accent}
              textColor={textColor}
              bg={bg}
            />
          )}

          {/* === ПЕРЕПИШИ === */}
          {activeTab === 'rewrite' && (
            <div className="flex flex-col gap-3">
              {!rewriteMode ? (
                <>
                  <p className="text-[10px] uppercase tracking-[0.18em] opacity-40" style={{ color: textColor }}>
                    Выбери вариант
                  </p>
                  <div className="flex flex-col gap-2">
                    {REWRITE_MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleRewrite(m.id)}
                        className="flex items-center gap-2 rounded-sm px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] transition-colors text-left"
                        style={{ backgroundColor: `${textColor}08`, color: textColor }}
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] opacity-40" style={{ color: textColor }}>
                      {rewriteMode}
                    </span>
                    <button
                      onClick={() => { setRewriteMode(null); setAiText('') }}
                      className="ml-auto text-[9px] uppercase tracking-[0.12em] opacity-40 transition-opacity hover:opacity-80"
                      style={{ color: accent }}
                    >
                      ← назад
                    </button>
                  </div>
                  <AiResult
                    aiText={aiText}
                    aiLoading={aiLoading}
                    aiError={aiError}
                    onRetry={() => handleRewrite(rewriteMode)}
                    accent={accent}
                    textColor={textColor}
                  />
                </>
              )}
            </div>
          )}

          {/* === СМЫСЛ === */}
          {activeTab === 'meaning' && (
            <AiPanel
              aiText={aiText}
              aiLoading={aiLoading}
              aiError={aiError}
              onStart={handleMeaning}
              onRetry={handleMeaning}
              startLabel="Раскрыть смысл"
              accent={accent}
              textColor={textColor}
              bg={bg}
            />
          )}

          {/* === НАРИСУЙ === */}
          {activeTab === 'illustrate' && (
            <div className="flex flex-col gap-3">
              {!imageUrl && !imageLoading && !imageError && (
                <button
                  onClick={handleIllustrate}
                  className="flex w-full items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ backgroundColor: accent, color: '#fff', borderRadius: '3px' }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Сгенерировать иллюстрацию
                </button>
              )}

              {imageLoading && (
                <div className="flex flex-col items-center gap-3 py-6">
                  {/* Animated placeholder */}
                  <div
                    className="h-36 w-full rounded-sm"
                    style={{
                      background: `linear-gradient(90deg, ${textColor}08 25%, ${textColor}14 50%, ${textColor}08 75%)`,
                      backgroundSize: '200% 100%',
                      animation: 'cf-skeleton 1.5s ease infinite',
                    }}
                  />
                  <p className="text-[10px] uppercase tracking-[0.18em] opacity-40" style={{ color: textColor }}>
                    Создаю иллюстрацию…
                  </p>
                </div>
              )}

              {imageError && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <ImageOff className="h-8 w-8 opacity-25" style={{ color: textColor }} />
                  <p className="text-center text-xs opacity-50" style={{ color: textColor }}>{imageError}</p>
                  {imageError !== 'Функция пока недоступна' && (
                    <button
                      onClick={handleIllustrate}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: accent }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Попробовать снова
                    </button>
                  )}
                </div>
              )}

              {imageUrl && (
                <div className="flex flex-col gap-2">
                  <img
                    src={imageUrl}
                    alt="Иллюстрация по мотивам цитаты"
                    className="w-full rounded-sm"
                    style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                  />
                  {imagePrompt && (
                    <p className="text-[10px] leading-snug opacity-30 italic" style={{ color: textColor }}>
                      {imagePrompt}
                    </p>
                  )}
                  <button
                    onClick={handleIllustrate}
                    className="flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                    style={{ color: accent, border: `1px solid ${accent}30`, borderRadius: '3px' }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Ещё вариант
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Sub-компонент: AI Panel (объясни / смысл)
function AiPanel({
  aiText, aiLoading, aiError,
  onStart, onRetry,
  startLabel,
  accent, textColor,
}: {
  aiText: string; aiLoading: boolean; aiError: string
  onStart: () => void; onRetry: () => void
  startLabel: string
  accent: string; textColor: string; bg: string
}) {
  useEffect(() => {
    onStart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AiResult
      aiText={aiText}
      aiLoading={aiLoading}
      aiError={aiError}
      onRetry={onRetry}
      accent={accent}
      textColor={textColor}
      startLabel={startLabel}
    />
  )
}

// Sub-компонент: AI Result / Loading / Error
function AiResult({
  aiText, aiLoading, aiError,
  onRetry, accent, textColor,
  startLabel,
}: {
  aiText: string; aiLoading: boolean; aiError: string
  onRetry: () => void
  accent: string; textColor: string
  startLabel?: string
}) {
  if (aiLoading && !aiText) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: accent }} />
        <span className="text-xs opacity-40" style={{ color: textColor }}>
          {startLabel ?? 'Думаю…'}
        </span>
      </div>
    )
  }

  if (aiError && !aiText) {
    return (
      <div className="flex flex-col gap-2 py-2">
        <p className="text-xs opacity-50" style={{ color: textColor }}>{aiError}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]"
          style={{ color: accent }}
        >
          <RotateCcw className="h-3 w-3" />
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {aiText && (
        <p
          className="font-[family-name:var(--font-cormorant)] text-[15px] italic leading-snug"
          style={{ color: textColor, opacity: aiLoading ? 0.7 : 1 }}
        >
          {aiText}
          {aiLoading && <span className="ml-0.5 animate-pulse">▌</span>}
        </p>
      )}
      {!aiLoading && aiText && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 self-end text-[9px] uppercase tracking-[0.14em] opacity-40 transition-opacity hover:opacity-80"
          style={{ color: textColor }}
        >
          <RotateCcw className="h-3 w-3" />
          Ещё раз
        </button>
      )}
    </div>
  )
}
