'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NewsPost } from '@/lib/types'

interface NewsFormProps {
  newsId?: string
}

const emptyForm = {
  section: '',
  title: '',
  content: '',
  tag: '',
  display_order: '0',
  is_active: true,
}

export function NewsForm({ newsId }: NewsFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(Boolean(newsId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEditing = Boolean(newsId)

  useEffect(() => {
    if (!newsId) return

    const loadPost = async () => {
      try {
        const response = await fetch(`/api/admin/news/${newsId}`)

        if (response.status === 401) {
          router.push('/admin/login')
          return
        }

        if (!response.ok) {
          throw new Error('Не удалось загрузить новость')
        }

        const post = (await response.json()) as NewsPost
        setForm({
          section: post.section || '',
          title: post.title || '',
          content: post.content || '',
          tag: post.tag || '',
          display_order: String(post.display_order ?? 0),
          is_active: post.is_active,
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [newsId, router])

  const payload = useMemo(
    () => ({
      section: form.section,
      title: form.title,
      content: form.content,
      tag: form.tag,
      display_order: parseInt(form.display_order, 10) || 0,
      is_active: form.is_active,
    }),
    [form],
  )

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        isEditing ? `/api/admin/news/${newsId}` : '/api/admin/news',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось сохранить новость')
      }

      router.push('/admin')
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Загрузка...</p>
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6">
      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Раздел (section)</span>
          <Input
            value={form.section}
            onChange={(event) => updateField('section', event.target.value)}
            required
            placeholder="dispatch / заметки / маршруты"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Заголовок</span>
          <Input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Содержание</span>
        <Textarea
          value={form.content}
          onChange={(event) => updateField('content', event.target.value)}
          rows={8}
          placeholder="Текст новости"
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Тег</span>
          <Input
            value={form.tag}
            onChange={(event) => updateField('tag', event.target.value)}
            placeholder="необязательно"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Порядок отображения</span>
          <Input
            type="number"
            value={form.display_order}
            onChange={(event) => updateField('display_order', event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => updateField('is_active', event.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
        />
        <span>Активна (отображается на главной)</span>
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
          Отмена
        </Button>
        <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700">
          {saving ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  )
}
