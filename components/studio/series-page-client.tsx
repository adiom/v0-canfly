'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Series } from '@/lib/releases-types'
import { generateSlug } from '@/lib/slug-utils'
import { createSeriesAction, updateSeriesAction, deleteSeriesAction } from '@/lib/actions/studio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Library } from 'lucide-react'

function SeriesFormDialog({
  series,
  trigger,
}: {
  series?: Series
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const isEdit = !!series
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(series?.title ?? '')
  const [slug, setSlug] = useState(series?.slug ?? '')
  const [description, setDescription] = useState(series?.description ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Название обязательно')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('slug', slug || generateSlug(title))
      formData.set('description', description)

      if (isEdit) {
        await updateSeriesAction(series!.id, formData)
        toast.success('Серия обновлена')
      } else {
        await createSeriesAction(formData)
        toast.success('Серия создана')
      }
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v)
      if (v && !isEdit) { setTitle(''); setSlug(''); setDescription('') }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-white/80 backdrop-blur-xl border-white/70 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{isEdit ? 'Редактировать серию' : 'Новая серия'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-600">Название</Label>
            <Input value={title} onChange={e => {
              setTitle(e.target.value)
              if (!isEdit) setSlug(generateSlug(e.target.value))
            }} placeholder="Название серии" className="bg-white/60 border-white/70 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Slug</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-white/60 border-white/70 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Описание</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-white/60 border-white/70 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/70 bg-white/60 text-gray-600 hover:bg-white/80 hover:text-gray-800">Отмена</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">{saving ? 'Сохраняю...' : isEdit ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SeriesPageClient({ series }: { series: Series[] }) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Удалить серию?')) return
    try {
      await deleteSeriesAction(id)
      toast.success('Серия удалена')
      router.refresh()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Серии</h1>
          <p className="mt-1 text-gray-500">Группируйте релизы в серии</p>
        </div>
        <SeriesFormDialog trigger={
          <Button className="h-11 px-5 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 hover:from-violet-700 hover:to-violet-600"><Plus className="mr-2 h-4 w-4" />Новая серия</Button>
        } />
      </div>

      {series.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200/80 bg-white/30 backdrop-blur-sm py-20">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-amber-100 mb-4">
            <Library className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Нет серий</p>
          <p className="mt-1 text-sm text-gray-400">Создайте первую серию для ваших релизов</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {series.map(s => (
            <div key={s.id} className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm shadow-black/5 p-4 md:p-5 transition-all duration-300 hover:bg-white/80 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{s.title}</h3>
                  {s.description && (
                    <p className="mt-1 text-sm text-gray-500">{s.description}</p>
                  )}
                </div>
                <SeriesFormDialog
                  series={s}
                  trigger={<Button size="icon-sm" className="rounded-xl bg-white/70 backdrop-blur-sm border border-white/70 text-gray-500 shadow-sm hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"><Pencil className="h-4 w-4" /></Button>}
                />
                <Button size="icon-sm" className="rounded-xl bg-white/70 backdrop-blur-sm border border-white/70 text-red-500/70 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}