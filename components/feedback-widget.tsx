'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function FeedbackWidget() {
  const { status } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  // Сбрасываем состояние при закрытии
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSent(false)
        setError('')
        setMessage('')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  if (status !== 'authenticated') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), page: pathname }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Не удалось отправить')
        return
      }

      setSent(true)
      setMessage('')
    } catch {
      setError('Ошибка соединения')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Панель */}
      {open && (
        <div className="fixed bottom-20 right-4 md:right-6 z-50 w-80 border border-[#f4efe5]/15 bg-[#1b1c19] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#f4efe5]/10 px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f4efe5]">Обратная связь</p>
              <p className="text-[10px] text-[#f4efe5]/40 mt-0.5 font-mono">{pathname}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#f4efe5]/30 hover:text-[#f4efe5]/70 transition-colors text-lg leading-none"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            {sent ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-[#f6d6a8] text-sm font-semibold">Отправлено</p>
                <p className="text-[#f4efe5]/40 text-xs">Спасибо за сообщение!</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-3 text-xs text-[#f4efe5]/40 hover:text-[#f4efe5]/70 underline transition-colors"
                >
                  Написать ещё
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Идея, баг, пожелание..."
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none bg-[#111210] border border-[#f4efe5]/10 text-[#f4efe5] text-sm px-3 py-2 placeholder-[#f4efe5]/25 focus:outline-none focus:border-[#f4efe5]/30 leading-6"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSubmit(e as unknown as React.FormEvent)
                    }
                  }}
                />
                {error && (
                  <p className="text-[#d52525] text-xs">{error}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#f4efe5]/20 text-[10px] font-mono">
                    {message.length}/1000 · ⌘↵
                  </span>
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="h-8 px-4 bg-[#d52525] text-white font-black uppercase text-xs tracking-[0.1em] hover:bg-[#b81e1e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? '...' : 'Отправить'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Кнопка-триггер */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 md:right-6 z-50 h-12 w-12 bg-[#1b1c19] border border-[#f4efe5]/15 text-[#f4efe5]/60 hover:text-[#f4efe5] hover:border-[#f4efe5]/35 transition-all shadow-lg flex items-center justify-center"
        aria-label="Обратная связь"
        title="Написать нам"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 3.5C2 2.67 2.67 2 3.5 2h11C15.33 2 16 2.67 16 3.5v8c0 .83-.67 1.5-1.5 1.5H5l-3 2.5V3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </>
  )
}
