'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoverImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  className?: string
}

const MAX_SIZE = 10 * 1024 * 1024

export function CoverImageUploader({ value, onChange, disabled, className }: CoverImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const upload = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Только изображения')
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error('Файл больше 10 МБ')
        return
      }

      setUploading(true)
      setProgress(0)

      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        setUploading(false)
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            onChange(data.url)
            toast.success('Обложка загружена')
          } else {
            toast.error(data.error ?? 'Ошибка загрузки')
          }
        } catch {
          toast.error('Ошибка ответа сервера')
        }
      })

      xhr.addEventListener('error', () => {
        setUploading(false)
        toast.error('Сетевая ошибка')
      })

      xhr.open('POST', '/api/studio/upload')
      xhr.send(formData)
    },
    [onChange],
  )

  const handleFile = useCallback(
    (file: File | null) => {
      if (file) upload(file)
    },
    [upload],
  )

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      handleFile(file ?? null)
      e.target.value = ''
    },
    [handleFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      handleFile(file ?? null)
    },
    [handleFile],
  )

  const handleRemove = useCallback(() => {
    onChange(null)
  }, [onChange])

  const handleReplace = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={e => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          'relative overflow-hidden rounded-md border-2 border-dashed transition-colors',
          dragOver ? 'border-foreground bg-muted/50' : 'border-muted-foreground/25',
          disabled || uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-foreground/60',
          value ? 'aspect-[3/4] max-w-[240px]' : 'p-8',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        ) : value ? (
          <Image
            src={value}
            alt="Обложка"
            fill
            sizes="240px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm font-medium">Загрузите обложку</p>
            <p className="text-xs">PNG, JPG, WebP · до 10 МБ</p>
          </div>
        )}
      </div>

      {value && !uploading && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReplace}
            disabled={disabled}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border bg-background text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Заменить
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
            aria-label="Удалить обложку"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
