'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface ComicPage {
  url: string
}

export function ComicPagesEditor({ editionId: _editionId }: { editionId: string }) {
  const [pages, setPages] = useState<ComicPage[]>([])
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/studio/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`Failed to upload ${file.name}: ${errorData.error || res.statusText}`)
        }

        const data = await res.json()
        uploadedUrls.push(data.url)
      }

      const newPages = [...pages, ...uploadedUrls.map(url => ({ url }))]
      setPages(newPages)
      toast.success(`Загружено ${uploadedUrls.length} страниц`)
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleAddByUrl() {
    const url = window.prompt('URL изображения:')
    if (url) {
      setPages([...pages, { url }])
    }
  }

  function handleDelete(index: number) {
    setPages(pages.filter((_, i) => i !== index))
    toast.success('Страница удалена')
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPages = [...pages]
    const draggedItem = newPages[draggedIndex]
    newPages.splice(draggedIndex, 1)
    newPages.splice(index, 0, draggedItem)

    setPages(newPages)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Страницы комикса ({pages.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddByUrl}>
            + URL
          </Button>
          <label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={e => {
                e.preventDefault()
                const input = e.currentTarget.previousElementSibling as HTMLInputElement | null
                if (input) input.click()
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </Button>
          </label>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          Страницы не добавлены. Загрузите изображения или добавьте по URL.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {pages.map((page, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-move border rounded overflow-hidden ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="aspect-[3/4] bg-muted">
                <img
                  src={page.url}
                  alt={`Страница ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-white font-medium mr-2">{index + 1}</span>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Перетаскивайте карточки для изменения порядка</p>
    </div>
  )
}