'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'
import { ImageIcon, X } from 'lucide-react'

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
  createCharacterPostAction,
  updateCharacterPostAction,
} from '@/lib/actions/studio-characters'
import type { CharacterPost } from '@/lib/types'

interface CharacterPostComposerProps {
  characterId: string
  post?: CharacterPost | null
}

export function CharacterPostComposer({ characterId, post }: CharacterPostComposerProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(post?.image_url ?? null)
  const [removedImage, setRemovedImage] = useState(false)

  const isEditing = Boolean(post)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setRemovedImage(false)
  }

  function handleRemoveImage() {
    setImagePreview(null)
    setRemovedImage(true)
  }

  async function handleSubmit(formData: FormData) {
    if (removedImage) formData.set('remove_image', 'true')
    setSaving(true)
    try {
      if (isEditing && post) {
        await updateCharacterPostAction(post.id, formData)
      } else {
        await createCharacterPostAction(characterId, formData)
      }
      toast.success(isEditing ? 'Пост обновлён' : 'Пост создан')
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения')
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="post_type">Тип</Label>
          <Select name="post_type" defaultValue={post?.post_type ?? 'thought'}>
            <SelectTrigger id="post_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thought">💭 Мысль</SelectItem>
              <SelectItem value="announcement">📢 Анонс</SelectItem>
              <SelectItem value="question">❓ Вопрос</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Текст поста</Label>
          <Textarea
            id="content"
            name="content"
            rows={6}
            defaultValue={post?.content ?? ''}
            required
            placeholder="Что хочет сказать персонаж?"
          />
        </div>

        <div className="space-y-2">
          <Label>Изображение</Label>
          {imagePreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-7 w-7"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-muted-foreground/60">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
                <span>Загрузить изображение</span>
              </div>
              <input
                type="file"
                name="image_file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_at">
            Запланировать публикацию (опционально)
          </Label>
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={
              post?.scheduled_at
                ? new Date(post.scheduled_at).toISOString().slice(0, 16)
                : ''
            }
          />
          <p className="text-xs text-muted-foreground">
            Оставьте пустым, чтобы опубликовать сразу
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/studio/characters/${characterId}`)}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Сохранение…' : isEditing ? 'Сохранить' : 'Опубликовать'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
