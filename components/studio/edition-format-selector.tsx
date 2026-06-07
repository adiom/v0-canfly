'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { useState } from 'react'
import { toast } from 'sonner'
import { createEditionAction } from '@/lib/actions/studio'
import { generateSlug } from '@/lib/slug-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BookOpen, Image, Headphones, Music, Newspaper, Radio,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

const formats = [
  { value: 'book', label: 'Книга', desc: 'Текстовое произведение с главами', icon: BookOpen },
  { value: 'comic', label: 'Комикс', desc: 'Визуальное повествование, страницы', icon: Image },
  { value: 'audiobook', label: 'Аудиокнига', desc: 'Озвученное произведение', icon: Headphones },
  { value: 'audiorelease', label: 'Аудиорелиз', desc: 'Альбом, подкаст, аудио-сингл', icon: Radio },
  { value: 'magazine', label: 'Журнал', desc: 'Статьи и материалы в сборнике', icon: Newspaper },
]

export function EditionFormatSelector({ releaseId }: { releaseId: string }) {
  const router = useRouter()
  const [creating, setCreating] = useState<string | null>(null)

  async function handleSelect(format: string) {
    setCreating(format)
    try {
      const formData = new FormData()
      formData.set('release_id', releaseId)
      formData.set('format', format)
      formData.set('slug', generateSlug(format))
      await createEditionAction(formData)
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка создания издания')
      setCreating(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/studio/releases/${releaseId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Выберите формат издания</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {formats.map(f => {
          const Icon = f.icon
          const isLoading = creating === f.value
          return (
            <Card
              key={f.value}
              className={`group cursor-pointer transition-all hover:border-primary/60 hover:shadow-md ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
              onClick={() => handleSelect(f.value)}
            >
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-lg font-semibold">{f.label}</span>
                <span className="text-sm text-muted-foreground">{f.desc}</span>
                {isLoading && (
                  <span className="text-xs text-muted-foreground animate-pulse">Создаю...</span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}