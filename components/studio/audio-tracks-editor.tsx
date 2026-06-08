'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Trash2, Headphones } from 'lucide-react'

interface AudioTrack {
  title: string
  url: string
  duration: string
}

export function AudioTracksEditor({ editionId: _editionId }: { editionId: string }) {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newDuration, setNewDuration] = useState('')

  function addTrack() {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error('Название и URL обязательны')
      return
    }
    setTracks([...tracks, { title: newTitle.trim(), url: newUrl.trim(), duration: newDuration.trim() }])
    setNewTitle('')
    setNewUrl('')
    setNewDuration('')
  }

  function removeTrack(index: number) {
    setTracks(tracks.filter((_, i) => i !== index))
  }

  function updateTrack(index: number, field: keyof AudioTrack, value: string) {
    setTracks(tracks.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }

  function moveTrack(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= tracks.length) return
    const newTracks = [...tracks]
    ;[newTracks[index], newTracks[swapIndex]] = [newTracks[swapIndex], newTracks[index]]
    setTracks(newTracks)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Аудио-треки ({tracks.length})</h3>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Название трека"
        />
        <Input
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="URL аудио"
        />
        <Button size="sm" onClick={addTrack}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          value={newDuration}
          onChange={e => setNewDuration(e.target.value)}
          placeholder="Длительность (например, 3:45)"
          className="max-w-xs"
        />
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          Треки не добавлены. Введите название и URL выше.
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          {tracks.map((track, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <Input
                  value={track.title}
                  onChange={e => updateTrack(index, 'title', e.target.value)}
                  className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
                <Input
                  value={track.url}
                  onChange={e => updateTrack(index, 'url', e.target.value)}
                  className="h-6 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-muted-foreground truncate"
                />
              </div>
              {track.duration && (
                <span className="text-xs text-muted-foreground shrink-0">{track.duration}</span>
              )}
              <div className="flex shrink-0 gap-0.5">
                <button
                  onClick={() => moveTrack(index, 'up')}
                  disabled={index === 0}
                  className="px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveTrack(index, 'down')}
                  disabled={index === tracks.length - 1}
                  className="px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-25"
                >
                  ↓
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeTrack(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}