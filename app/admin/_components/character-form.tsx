'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Character } from '@/lib/types'

interface CharacterFormProps {
  characterId?: string
}

const emptyForm = {
  name: '',
  slug: '',
  avatar: '',
  bio: '',
  full_description: '',
  abilities: '',
  speaking_style: '',
  personality: '',
  boundaries: '',
  knowledge_scope: '',
  spoiler_policy: '',
  reply_mode: 'ai_auto',
  can_receive_messages: 'true',
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export function CharacterForm({ characterId }: CharacterFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(Boolean(characterId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEditing = Boolean(characterId)

  useEffect(() => {
    if (!characterId) return

    const loadCharacter = async () => {
      try {
        const response = await fetch(`/api/admin/characters/${characterId}`)

        if (response.status === 401) {
          router.push('/admin/login')
          return
        }

        if (!response.ok) {
          throw new Error('Не удалось загрузить персонажа')
        }

        const character = (await response.json()) as Character
        setForm({
          name: character.name || '',
          slug: character.slug || '',
          avatar: character.avatar || '',
          bio: character.bio || '',
          full_description: character.full_description || '',
          abilities: Array.isArray(character.abilities) 
            ? character.abilities.join('\n') 
            : '',
          speaking_style: character.speaking_style || '',
          personality: character.personality || '',
          boundaries: character.boundaries || '',
          knowledge_scope: character.knowledge_scope || '',
          spoiler_policy: character.spoiler_policy || '',
          reply_mode: character.reply_mode || 'ai_auto',
          can_receive_messages: character.can_receive_messages === false ? 'false' : 'true',
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }

    loadCharacter()
  }, [characterId, router])

  const payload = useMemo(
    () => ({
      name: form.name,
      slug: form.slug,
      avatar: form.avatar,
      bio: form.bio,
      full_description: form.full_description,
      abilities: form.abilities.split('\n'),
      speaking_style: form.speaking_style,
      personality: form.personality,
      boundaries: form.boundaries,
      knowledge_scope: form.knowledge_scope,
      spoiler_policy: form.spoiler_policy,
      reply_mode: form.reply_mode,
      can_receive_messages: form.can_receive_messages === 'true',
    }),
    [form],
  )

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        isEditing ? `/api/admin/characters/${characterId}` : '/api/admin/characters',
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
        throw new Error(data.error || 'Не удалось сохранить персонажа')
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
          <span>Имя</span>
          <Input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            onBlur={() => {
              if (!form.slug) updateField('slug', createSlug(form.name))
            }}
            required
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Slug</span>
          <Input
            value={form.slug}
            onChange={(event) => updateField('slug', event.target.value)}
            required
            className="border-slate-700 bg-slate-950 text-white"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Avatar URL</span>
        <Input
          value={form.avatar}
          onChange={(event) => updateField('avatar', event.target.value)}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Краткое описание</span>
        <Textarea
          value={form.bio}
          onChange={(event) => updateField('bio', event.target.value)}
          rows={3}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Полное описание</span>
        <Textarea
          value={form.full_description}
          onChange={(event) => updateField('full_description', event.target.value)}
          rows={8}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Способности, по одной на строку</span>
        <Textarea
          value={form.abilities}
          onChange={(event) => updateField('abilities', event.target.value)}
          rows={5}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Режим ответов</span>
          <select
            value={form.reply_mode}
            onChange={(event) => updateField('reply_mode', event.target.value)}
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            <option value="ai_auto">AI автоматически</option>
            <option value="manual">Вручную</option>
            <option value="hybrid">AI + подтверждение</option>
            <option value="disabled">Отключено</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>Можно писать персонажу</span>
          <select
            value={form.can_receive_messages}
            onChange={(event) => updateField('can_receive_messages', event.target.value)}
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </select>
        </label>
      </div>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Манера речи</span>
        <Textarea
          value={form.speaking_style}
          onChange={(event) => updateField('speaking_style', event.target.value)}
          rows={3}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Характер</span>
        <Textarea
          value={form.personality}
          onChange={(event) => updateField('personality', event.target.value)}
          rows={3}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Границы знаний</span>
        <Textarea
          value={form.knowledge_scope}
          onChange={(event) => updateField('knowledge_scope', event.target.value)}
          rows={3}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Политика спойлеров</span>
        <Textarea
          value={form.spoiler_policy}
          onChange={(event) => updateField('spoiler_policy', event.target.value)}
          rows={3}
          className="border-slate-700 bg-slate-950 text-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        <span>Ограничения персонажа</span>
        <Textarea
          value={form.boundaries}
          onChange={(event) => updateField('boundaries', event.target.value)}
          rows={3}
          className="border-slate-700 bg-slate-950 text-white"
        />
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
