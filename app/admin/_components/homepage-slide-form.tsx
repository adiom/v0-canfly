'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HomepageSlide, HomepageSlideTheme } from '@/lib/types'

interface HomepageSlideFormProps {
  slideId?: string
}

const emptyForm = {
  title: '',
  eyebrow: '',
  description: '',
  background_image: '',
  mobile_image: '',
  primary_cta_label: '',
  primary_cta_href: '',
  secondary_cta_label: '',
  secondary_cta_href: '',
  theme: 'atelier' as HomepageSlideTheme,
  is_active: true,
  display_order: '0',
}

const themes: Array<{ value: HomepageSlideTheme; label: string }> = [
  { value: 'atelier', label: 'Ателье / ткань' },
  { value: 'night-city', label: 'Ночной город' },
  { value: 'pvz', label: 'ПВЗ / логистика' },
  { value: 'volga', label: 'Волга / инженерия' },
  { value: 'dreams', label: 'Мир Снов' },
]

export function HomepageSlideForm({ slideId }: HomepageSlideFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(Boolean(slideId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEditing = Boolean(slideId)

  useEffect(() => {
    if (!slideId) return

    const loadSlide = async () => {
      try {
        const response = await fetch(`/api/admin/homepage-slides/${slideId}`)

        if (response.status === 401) {
          router.push('/admin/login')
          return
        }

        if (!response.ok) {
          throw new Error('Не удалось загрузить слайд')
        }

        const slide = (await response.json()) as HomepageSlide
        setForm({
          title: slide.title || '',
          eyebrow: slide.eyebrow || '',
          description: slide.description || '',
          background_image: slide.background_image || '',
          mobile_image: slide.mobile_image || '',
          primary_cta_label: slide.primary_cta_label || '',
          primary_cta_href: slide.primary_cta_href || '',
          secondary_cta_label: slide.secondary_cta_label || '',
          secondary_cta_href: slide.secondary_cta_href || '',
          theme: slide.theme || 'atelier',
          is_active: Boolean(slide.is_active),
          display_order:
            slide.display_order === null || slide.display_order === undefined
              ? '0'
              : String(slide.display_order),
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }

    loadSlide()
  }, [slideId, router])

  const payload = useMemo(
    () => ({
      title: form.title,
      eyebrow: form.eyebrow,
      description: form.description,
      background_image: form.background_image,
      mobile_image: form.mobile_image,
      primary_cta_label: form.primary_cta_label,
      primary_cta_href: form.primary_cta_href,
      secondary_cta_label: form.secondary_cta_label,
      secondary_cta_href: form.secondary_cta_href,
      theme: form.theme,
      is_active: form.is_active,
      display_order: form.display_order ? Number(form.display_order) : 0,
    }),
    [form],
  )

  const updateField = <Field extends keyof typeof form>(field: Field, value: (typeof form)[Field]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        isEditing ? `/api/admin/homepage-slides/${slideId}` : '/api/admin/homepage-slides',
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
        throw new Error(data.error || 'Не удалось сохранить слайд')
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

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Заголовок</span>
          <Input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Порядок</span>
          <Input
            type="number"
            value={form.display_order}
            onChange={(event) => updateField('display_order', event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Eyebrow / рубрика</span>
          <Input
            value={form.eyebrow}
            onChange={(event) => updateField('eyebrow', event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Тема оформления</span>
          <select
            value={form.theme}
            onChange={(event) => updateField('theme', event.target.value as HomepageSlideTheme)}
            className="h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {themes.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Описание</span>
        <Textarea
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          rows={5}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Фоновое изображение URL</span>
          <Input
            value={form.background_image}
            onChange={(event) => updateField('background_image', event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Мобильное изображение URL</span>
          <Input
            value={form.mobile_image}
            onChange={(event) => updateField('mobile_image', event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Основная кнопка</span>
          <Input
            value={form.primary_cta_label}
            onChange={(event) => updateField('primary_cta_label', event.target.value)}
            placeholder="Читать"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Ссылка основной кнопки</span>
          <Input
            value={form.primary_cta_href}
            onChange={(event) => updateField('primary_cta_href', event.target.value)}
            placeholder="/books"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Вторичная кнопка</span>
          <Input
            value={form.secondary_cta_label}
            onChange={(event) => updateField('secondary_cta_label', event.target.value)}
            placeholder="Подробнее"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Ссылка вторичной кнопки</span>
          <Input
            value={form.secondary_cta_href}
            onChange={(event) => updateField('secondary_cta_href', event.target.value)}
            placeholder="/characters"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => updateField('is_active', event.target.checked)}
          className="size-4 rounded border-slate-700 bg-slate-950"
        />
        Активен на главной
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
        <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
          Отмена
        </Button>
        <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700">
          {saving ? 'Сохранение...' : 'Сохранить слайд'}
        </Button>
      </div>
    </form>
  )
}
