'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import {
  createCharacterAction,
  updateCharacterAction,
} from '@/lib/actions/studio-characters'
import type { Character } from '@/lib/types'

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

interface CharacterFormProps {
  character?: Character | null
}

export function CharacterForm({ character }: CharacterFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(character?.name ?? '')
  const [slug, setSlug] = useState(character?.slug ?? '')

  const isEditing = Boolean(character)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    try {
      if (isEditing && character) {
        await updateCharacterAction(character.id, formData)
      } else {
        await createCharacterAction(formData)
      }
      toast.success(isEditing ? 'Сохранено' : 'Персонаж создан')
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения')
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <form action={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (!slug && name) setSlug(createSlug(name))
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input
            id="avatar"
            name="avatar"
            type="url"
            defaultValue={character?.avatar ?? ''}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Краткое описание</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={character?.bio ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_description">Полное описание</Label>
          <Textarea
            id="full_description"
            name="full_description"
            rows={8}
            defaultValue={character?.full_description ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="abilities">Способности (по одной на строку)</Label>
          <Textarea
            id="abilities"
            name="abilities"
            rows={5}
            defaultValue={character?.abilities?.join('\n') ?? ''}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reply_mode">Режим ответов</Label>
            <Select name="reply_mode" defaultValue={character?.reply_mode ?? 'ai_auto'}>
              <SelectTrigger id="reply_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai_auto">AI автоматически</SelectItem>
                <SelectItem value="manual">Вручную</SelectItem>
                <SelectItem value="hybrid">AI + подтверждение</SelectItem>
                <SelectItem value="disabled">Отключено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="can_receive_messages">Принимает сообщения</Label>
            <Select
              name="can_receive_messages"
              defaultValue={character?.can_receive_messages === false ? 'false' : 'true'}
            >
              <SelectTrigger id="can_receive_messages">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Да</SelectItem>
                <SelectItem value="false">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speaking_style">Манера речи</Label>
          <Textarea
            id="speaking_style"
            name="speaking_style"
            rows={3}
            defaultValue={character?.speaking_style ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="personality">Характер</Label>
          <Textarea
            id="personality"
            name="personality"
            rows={3}
            defaultValue={character?.personality ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="knowledge_scope">Границы знаний</Label>
          <Textarea
            id="knowledge_scope"
            name="knowledge_scope"
            rows={3}
            defaultValue={character?.knowledge_scope ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spoiler_policy">Политика спойлеров</Label>
          <Textarea
            id="spoiler_policy"
            name="spoiler_policy"
            rows={3}
            defaultValue={character?.spoiler_policy ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="boundaries">Ограничения</Label>
          <Textarea
            id="boundaries"
            name="boundaries"
            rows={3}
            defaultValue={character?.boundaries ?? ''}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/studio/characters')}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Сохранение…' : isEditing ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
