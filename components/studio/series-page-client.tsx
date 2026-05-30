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
import { Card, CardContent } from '@/components/ui/card'
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать серию' : 'Новая серия'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={title} onChange={e => {
              setTitle(e.target.value)
              if (!isEdit) setSlug(generateSlug(e.target.value))
            }} placeholder="Название серии" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Сохраняю...' : isEdit ? 'Сохранить' : 'Создать'}</Button>
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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Серии</h1>
          <p className="mt-1 text-muted-foreground">Группируйте релизы в серии</p>
        </div>
        <SeriesFormDialog trigger={
          <Button><Plus className="mr-2 h-4 w-4" />Новая серия</Button>
        } />
      </div>

      {series.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Library className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Нет серий</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {series.map(s => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{s.title}</h3>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                </div>
                <SeriesFormDialog
                  series={s}
                  trigger={<Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button>}
                />
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
