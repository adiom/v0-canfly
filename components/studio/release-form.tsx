'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'
import type { Release } from '@/lib/releases-types'
import { generateSlug } from '@/lib/slug-utils'
import { createReleaseAction, updateReleaseAction } from '@/lib/actions/studio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CoverImageUploader } from '@/components/studio/cover-image-uploader'

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
      <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm shadow-black/5 p-5 md:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">{isEdit ? 'Редактирование' : 'Новый релиз'}</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-600">Название</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Название произведения" className="bg-white/60 border-white/70 rounded-xl focus-visible:ring-violet-500/30" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-gray-600">Slug</Label>
            <Input id="slug" value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true) }} placeholder="url-slug" className="bg-white/60 border-white/70 rounded-xl focus-visible:ring-violet-500/30" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-600">Описание</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Краткое описание" className="bg-white/60 border-white/70 rounded-xl focus-visible:ring-violet-500/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre" className="text-gray-600">Жанр</Label>
              <Input id="genre" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Фантастика" className="bg-white/60 border-white/70 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release_date" className="text-gray-600">Дата выпуска</Label>
              <Input id="release_date" type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="bg-white/60 border-white/70 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn" className="text-gray-600">ISBN</Label>
              <Input id="isbn" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-..." className="bg-white/60 border-white/70 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Обложка</Label>
              <CoverImageUploader value={coverImage || null} onChange={setCoverImage} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annotation" className="text-gray-600">Аннотация</Label>
            <Textarea id="annotation" value={annotation} onChange={e => setAnnotation(e.target.value)} rows={3} placeholder="Аннотация для читателей" className="bg-white/60 border-white/70 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editor_notes" className="text-gray-600">Заметки редактора</Label>
            <Textarea id="editor_notes" value={editorNotes} onChange={e => setEditorNotes(e.target.value)} rows={2} placeholder="Внутренние заметки" className="bg-white/60 border-white/70 rounded-xl" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">
              {saving ? 'Сохраняю...' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl border-white/70 bg-white/60 text-gray-600 hover:bg-white/80">
              Отмена
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}