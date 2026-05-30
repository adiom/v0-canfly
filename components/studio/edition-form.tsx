'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createEditionAction } from '@/lib/actions/studio'
import { generateSlug } from '@/lib/slug-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

const formats = [
  { value: 'book', label: 'Книга' },
  { value: 'comic', label: 'Комикс' },
  { value: 'audiobook', label: 'Аудиокнига' },
  { value: 'album', label: 'Альбом' },
  { value: 'magazine', label: 'Журнал' },
]

export function EditionFormDialog({ releaseId }: { releaseId: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [format, setFormat] = useState('book')
  const [platform, setPlatform] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    const formatLabel = formats.find(f => f.value === format)?.label ?? format
    setSlug(generateSlug(formatLabel + (platform ? `-${platform}` : '')))
  }, [format, platform])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim()) {
      toast.error('Slug обязателен')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.set('release_id', releaseId)
      formData.set('format', format)
      formData.set('platform', platform)
      formData.set('external_url', externalUrl)
      formData.set('slug', slug)
      await createEditionAction(formData)
      setOpen(false)
    } catch {
      toast.error('Ошибка создания издания')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Новое издание
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новое издание</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Формат</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Платформа</Label>
            <Input value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Litres, Bookmate..." />
          </div>

          <div className="space-y-2">
            <Label>Внешняя ссылка</Label>
            <Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Создаю...' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
