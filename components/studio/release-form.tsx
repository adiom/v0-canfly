'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { toast } from 'sonner'
import type { Release } from '@/lib/releases-types'
import { generateSlug } from '@/lib/slug-utils'
import { createReleaseAction, updateReleaseAction } from '@/lib/actions/studio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReleaseFormProps {
  release?: Release | null
}

export function ReleaseForm({ release }: ReleaseFormProps) {
  const router = useRouter()
  const isEdit = !!release
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState(release?.title ?? '')
  const [slug, setSlug] = useState(release?.slug ?? '')
  const [description, setDescription] = useState(release?.description ?? '')
  const [genre, setGenre] = useState(release?.genre ?? '')
  const [coverImage, setCoverImage] = useState(release?.cover_image ?? '')
  const [releaseDate, setReleaseDate] = useState(
    release?.release_date
      ? new Date(release.release_date).toISOString().split('T')[0]
      : ''
  )
  const [isbn, setIsbn] = useState(release?.isbn ?? '')
  const [annotation, setAnnotation] = useState(release?.annotation ?? '')
  const [editorNotes, setEditorNotes] = useState(release?.editor_notes ?? '')
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    if (!slugManual && !isEdit) {
      setSlug(generateSlug(title))
    }
  }, [title, slugManual, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) {
      toast.error('Заголовок и slug обязательны')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('slug', slug)
      formData.set('description', description)
      formData.set('cover_image', coverImage)
      formData.set('genre', genre)
      formData.set('release_date', releaseDate)
      formData.set('isbn', isbn)
      formData.set('annotation', annotation)
      formData.set('editor_notes', editorNotes)
      formData.set('authors', JSON.stringify([]))
      if (isEdit) {
        formData.set('status', release!.status)
        await updateReleaseAction(release!.id, formData)
        toast.success('Сохранено')
      } else {
        await createReleaseAction(formData)
      }
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Редактирование' : 'Новый релиз'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Название произведения" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true) }} placeholder="url-slug" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Краткое описание" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Жанр</Label>
              <Input id="genre" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Фантастика" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release_date">Дата выпуска</Label>
              <Input id="release_date" type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Обложка (URL)</Label>
              <Input id="cover" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annotation">Аннотация</Label>
            <Textarea id="annotation" value={annotation} onChange={e => setAnnotation(e.target.value)} rows={3} placeholder="Аннотация для читателей" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editor_notes">Заметки редактора</Label>
            <Textarea id="editor_notes" value={editorNotes} onChange={e => setEditorNotes(e.target.value)} rows={2} placeholder="Внутренние заметки" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохраняю...' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
