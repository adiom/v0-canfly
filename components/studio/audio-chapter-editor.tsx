'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { put } from '@vercel/blob/client'
import { toast } from 'sonner'
import { Headphones, Loader2, Music2, Save, Trash2, Upload } from 'lucide-react'
import type { Chapter } from '@/lib/releases-types'
import {
  applyAudioCoverToReleaseAction,
  finalizeAudioChapterUploadAction,
  removeAudioChapterFileAction,
  updateChapterAction,
} from '@/lib/actions/studio'
import { formatDuration } from '@/lib/utils/editions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AudioChapterEditorProps {
  chapter: Chapter
  onSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
}

const MAX_AUDIO_SIZE = 500 * 1024 * 1024
const ACCEPTED_AUDIO = '.mp3,.m4a,.aac,.ogg,.wav,.flac,audio/*'

function stringMeta(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === 'string' ? value : ''
}

function numberMeta(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function AudioChapterEditor({ chapter, onSaveStatus }: AudioChapterEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const initialMetadata = useMemo(() => chapter.audio_metadata ?? {}, [chapter.audio_metadata])
  const [title, setTitle] = useState(chapter.title)
  const [audioUrl, setAudioUrl] = useState(chapter.audio_url ?? '')
  const [durationSeconds, setDurationSeconds] = useState<number | null>(chapter.duration_seconds)
  const [artist, setArtist] = useState(stringMeta(initialMetadata, 'artist'))
  const [album, setAlbum] = useState(stringMeta(initialMetadata, 'album'))
  const [year, setYear] = useState(numberMeta(initialMetadata, 'year')?.toString() ?? '')
  const [trackNo, setTrackNo] = useState(numberMeta(initialMetadata, 'trackNo')?.toString() ?? '')
  const [codec, setCodec] = useState(stringMeta(initialMetadata, 'codec'))
  const [bitrate, setBitrate] = useState(numberMeta(initialMetadata, 'bitrate'))
  const [sampleRate, setSampleRate] = useState(numberMeta(initialMetadata, 'sampleRate'))
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPending, startTransition] = useTransition()

  const canSave = title.trim().length > 0 && !uploading && !isPending

  const buildMetadata = useCallback(() => ({
    ...initialMetadata,
    artist: artist.trim() || undefined,
    album: album.trim() || undefined,
    year: year.trim() ? Number(year) : undefined,
    trackNo: trackNo.trim() ? Number(trackNo) : undefined,
    codec: codec || undefined,
    bitrate: bitrate ?? undefined,
    sampleRate: sampleRate ?? undefined,
  }), [album, artist, bitrate, codec, initialMetadata, sampleRate, trackNo, year])

  const uploadAudio = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(file.name)) {
      toast.error('Поддерживаются только m4a, mp3, aac, ogg, wav, flac')
      return
    }
    if (file.size > MAX_AUDIO_SIZE) {
      toast.error('Аудиофайл больше 500 МБ')
      return
    }

    setUploading(true)
    setProgress(0)
    onSaveStatus('saving')

    try {
      const tokenResponse = await fetch('/api/studio/upload/audio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          filename: file.name,
          contentType: file.type || 'audio/mpeg',
          size: file.size,
        }),
      })
      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenData.token || !tokenData.pathname) {
        throw new Error(tokenData.error ?? 'Не удалось подготовить загрузку')
      }

      const blob = await put(tokenData.pathname, file, {
        access: 'public',
        token: tokenData.token,
        contentType: file.type || undefined,
        multipart: file.size > 100 * 1024 * 1024,
        onUploadProgress: event => setProgress(event.percentage),
      })

      const result = await finalizeAudioChapterUploadAction(chapter.id, {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType ?? file.type,
        size: file.size,
      })

      if (!result?.chapter) throw new Error('Не удалось сохранить аудиотрек')

      const updated = result.chapter
      const metadata = updated.audio_metadata ?? {}
      setTitle(updated.title)
      setAudioUrl(updated.audio_url ?? '')
      setDurationSeconds(updated.duration_seconds)
      setArtist(stringMeta(metadata, 'artist'))
      setAlbum(stringMeta(metadata, 'album'))
      setYear(numberMeta(metadata, 'year')?.toString() ?? '')
      setTrackNo(numberMeta(metadata, 'trackNo')?.toString() ?? '')
      setCodec(stringMeta(metadata, 'codec'))
      setBitrate(numberMeta(metadata, 'bitrate'))
      setSampleRate(numberMeta(metadata, 'sampleRate'))
      setCoverUrl(result.coverUrl)
      onSaveStatus('saved')
      toast.success('Аудиотрек загружен')
    } catch (error) {
      onSaveStatus('error')
      toast.error(error instanceof Error ? error.message : 'Ошибка загрузки аудио')
    } finally {
      setUploading(false)
    }
  }, [chapter.id, onSaveStatus])

  const handleFile = useCallback((file: File | null) => {
    if (file) void uploadAudio(file)
  }, [uploadAudio])

  function saveMetadata() {
    if (!canSave) return
    onSaveStatus('saving')
    startTransition(async () => {
      try {
        const updated = await updateChapterAction(chapter.id, {
          title: title.trim(),
          duration_seconds: durationSeconds,
          audio_metadata: buildMetadata(),
        })
        if (updated) {
          setTitle(updated.title)
          onSaveStatus('saved')
          toast.success('Трек сохранён')
        }
      } catch {
        onSaveStatus('error')
        toast.error('Ошибка сохранения')
      }
    })
  }

  function removeAudio() {
    startTransition(async () => {
      onSaveStatus('saving')
      try {
        const updated = await removeAudioChapterFileAction(chapter.id)
        if (updated) {
          setAudioUrl('')
          setDurationSeconds(null)
          setArtist('')
          setAlbum('')
          setYear('')
          setTrackNo('')
          setCodec('')
          setBitrate(null)
          setSampleRate(null)
          setCoverUrl(null)
        }
        onSaveStatus('saved')
        toast.success('Аудиофайл удалён')
      } catch {
        onSaveStatus('error')
        toast.error('Ошибка удаления аудио')
      }
    })
  }

  function applyCover() {
    if (!coverUrl) return
    startTransition(async () => {
      try {
        await applyAudioCoverToReleaseAction(chapter.id, coverUrl)
        toast.success('Обложка релиза обновлена')
        setCoverUrl(null)
      } catch {
        toast.error('Не удалось обновить обложку')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={event => {
          event.preventDefault()
          if (!uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={event => {
          event.preventDefault()
          setDragOver(false)
          handleFile(event.dataTransfer.files?.[0] ?? null)
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed bg-white/60 p-6 text-center shadow-sm shadow-black/5 transition-colors',
          dragOver ? 'border-violet-400 bg-violet-50/70' : 'border-white/70',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_AUDIO}
          className="hidden"
          onChange={event => {
            handleFile(event.target.files?.[0] ?? null)
            event.target.value = ''
          }}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </div>
        <h2 className="text-lg font-bold text-gray-900">Загрузите аудиофайл</h2>
        <p className="mt-1 text-sm text-gray-500">m4a, mp3, aac, ogg, wav, flac · до 500 МБ</p>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || isPending}
          className="mt-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
        >
          {uploading ? 'Загружаю...' : 'Выбрать файл'}
        </Button>
        {uploading && (
          <div className="mx-auto mt-4 max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{progress}%</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm shadow-black/5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Данные трека</h3>
            <p className="text-xs text-gray-400">Теги можно исправить вручную</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-gray-600">Название</Label>
            <Input value={title} onChange={event => setTitle(event.target.value)} className="rounded-xl bg-white/70" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Автор / артист</Label>
            <Input value={artist} onChange={event => setArtist(event.target.value)} className="rounded-xl bg-white/70" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Альбом</Label>
            <Input value={album} onChange={event => setAlbum(event.target.value)} className="rounded-xl bg-white/70" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Год</Label>
            <Input value={year} onChange={event => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))} className="rounded-xl bg-white/70" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Номер трека</Label>
            <Input value={trackNo} onChange={event => setTrackNo(event.target.value.replace(/\D/g, '').slice(0, 4))} className="rounded-xl bg-white/70" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-white/70 bg-white/50 p-4 text-sm text-gray-500 sm:grid-cols-3">
          <div><span className="block text-xs uppercase tracking-wide text-gray-400">Длительность</span>{durationSeconds ? formatDuration(durationSeconds) : 'Не определена'}</div>
          <div><span className="block text-xs uppercase tracking-wide text-gray-400">Кодек</span>{codec || 'Не определён'}</div>
          <div><span className="block text-xs uppercase tracking-wide text-gray-400">Битрейт</span>{bitrate ? `${Math.round(bitrate / 1000)} kbps` : 'Не определён'}</div>
          <div><span className="block text-xs uppercase tracking-wide text-gray-400">Sample rate</span>{sampleRate ? `${sampleRate} Hz` : 'Не определён'}</div>
          <div className="sm:col-span-2"><span className="block text-xs uppercase tracking-wide text-gray-400">URL</span><span className="break-all">{audioUrl || 'Файл не загружен'}</span></div>
        </div>

        {audioUrl && (
          <audio controls src={audioUrl} className="mt-5 w-full" preload="metadata" />
        )}

        {coverUrl && (
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-amber-100">
              <Image src={coverUrl} alt="Обложка из аудиофайла" fill sizes="80px" className="object-cover" unoptimized />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">В файле найдена обложка</p>
              <p className="text-xs text-amber-700">Можно применить её как обложку релиза.</p>
            </div>
            <Button type="button" variant="outline" onClick={applyCover} disabled={isPending} className="rounded-xl bg-white/70">
              Применить
            </Button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          {audioUrl && (
            <Button type="button" variant="outline" onClick={removeAudio} disabled={uploading || isPending} className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить аудио
            </Button>
          )}
          <Button type="button" onClick={saveMetadata} disabled={!canSave} className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      {!audioUrl && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Music2 className="mr-2 inline h-4 w-4" />
          Трек без аудиофайла не будет воспроизводиться в публичном плеере.
        </div>
      )}
    </div>
  )
}
