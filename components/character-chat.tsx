'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { useRef, useEffect, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface CharacterChatProps {
  characterSlug: string
  characterName: string
  characterAvatar: string
}

export function CharacterChat({ characterSlug, characterName, characterAvatar }: CharacterChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Привет! Я ${characterName}. Рад(а) познакомиться с тобой. Хочешь узнать больше о мне, о нашей вселенной или просто поговорить?`,
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/characters/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: input }]),
          characterSlug,
        }),
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantMessage = ''
      const messageId = Date.now().toString()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === messageId)
          if (existing) {
            return prev.map((m) => (m.id === messageId ? { ...m, content: assistantMessage } : m))
          }
          return [
            ...prev,
            {
              id: messageId,
              role: 'assistant',
              content: assistantMessage,
            },
          ]
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Извини, произошла ошибка. Попробуй ещё раз.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {message.role === 'assistant' && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-600">
                <Image
                  src={characterAvatar}
                  alt={characterName}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div
              className={`max-w-sm lg:max-w-md px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>

            {message.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">Я</span>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-600">
              <Image
                src={characterAvatar}
                alt={characterName}
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-slate-700 px-4 py-3 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Спроси ${characterName}...`}
          disabled={isLoading}
          className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? 'Думает...' : 'Отправить'}
        </Button>
      </form>
    </div>
  )
}
