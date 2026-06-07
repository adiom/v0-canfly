'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
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
  const [isPrimary, setIsPrimary] = useState(false)

  const autoSlug = useMemo(() => {
    const formatLabel = formats.find(f => f.value === format)?.label ?? format
    return generateSlug(formatLabel + (platform ? `-${platform}` : ''))
  }, [format, platform])
  const effectiveSlug = slug || autoSlug

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
      formData.set('slug', effectiveSlug)
      formData.set('is_primary', isPrimary ? 'true' : 'false')
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
        <Button size="sm" className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">
          <Plus className="mr-2 h-4 w-4" />
          Новое издание
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white/80 backdrop-blur-xl border-white/70 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Новое издание</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-600">Формат</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-white/60 border-white/70 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {formats.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600">Платформа</Label>
            <Input value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Litres, Bookmate..." className="bg-white/60 border-white/70 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600">Внешняя ссылка</Label>
            <Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." className="bg-white/60 border-white/70 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600">Slug</Label>
            <Input value={effectiveSlug} onChange={e => setSlug(e.target.value)} className="bg-white/60 border-white/70 rounded-xl" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={isPrimary}
              onChange={e => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded accent-violet-600"
            />
            <Label htmlFor="is_primary" className="cursor-pointer font-normal text-gray-600">
              Главное издание <span className="text-gray-400 text-xs">(показывается на странице релиза)</span>
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/70 bg-white/60 text-gray-600 hover:bg-white/80">Отмена</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">{saving ? 'Сохраняю...' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}