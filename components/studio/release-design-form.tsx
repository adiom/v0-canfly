'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Release, ReleaseDesignConfig } from '@/lib/releases-types'
import { updateReleaseDesignAction } from '@/lib/actions/studio'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const defaultConfig: ReleaseDesignConfig = {
  accent_color: '#d52525',
  bg_color: '#111210',
  text_color: '#f4efe5',
  hero_style: 'full',
  hero_overlay: 'gradient',
  layout: 'narrow',
  show_toc: true,
  show_characters: true,
  show_series: true,
}

const presets: { label: string; config: ReleaseDesignConfig }[] = [
  {
    label: 'canfly (default)',
    config: { accent_color: '#d52525', bg_color: '#111210', text_color: '#f4efe5', hero_style: 'full', hero_overlay: 'gradient', layout: 'narrow', show_toc: true, show_characters: true, show_series: true },
  },
  {
    label: 'Тёмный минимал',
    config: { accent_color: '#9db5c8', bg_color: '#0c0d0c', text_color: '#ded7cc', hero_style: 'minimal', hero_overlay: 'none', layout: 'narrow', show_toc: true, show_characters: false, show_series: false },
  },
  {
    label: 'Светлый',
    config: { accent_color: '#d52525', bg_color: '#f4efe5', text_color: '#111210', hero_style: 'centered', hero_overlay: 'none', layout: 'wide', show_toc: true, show_characters: true, show_series: true },
  },
  {
    label: 'Артхаус',
    config: { accent_color: '#f6d6a8', bg_color: '#1b1c19', text_color: '#d7c6ad', hero_style: 'full', hero_overlay: 'dark', layout: 'sidebar', show_toc: true, show_characters: true, show_series: true },
  },
]

const heroLabels: Record<string, string> = { full: 'Full-width', centered: 'Центрированная', minimal: 'Минимальная' }
const overlayLabels: Record<string, string> = { dark: 'Тёмный overlay', gradient: 'Градиент', none: 'Без overlay' }
const layoutLabels: Record<string, string> = { wide: 'Широкий', narrow: 'Узкий (центр)', sidebar: 'С sidebar' }

export function ReleaseDesignForm({ release }: { release: Release }) {
  const [config, setConfig] = useState<ReleaseDesignConfig>(release.design_config ?? {})
  const [saving, setSaving] = useState(false)

  function update<K extends keyof ReleaseDesignConfig>(key: K, value: ReleaseDesignConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function applyPreset(preset: ReleaseDesignConfig) {
    setConfig(preset)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateReleaseDesignAction(release.id, config)
      toast.success('Дизайн сохранён')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const accent = config.accent_color ?? defaultConfig.accent_color
  const bg = config.bg_color ?? defaultConfig.bg_color
  const text = config.text_color ?? defaultConfig.text_color

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Предустановки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {presets.map(p => (
              <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p.config)}>
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цветовая тема</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Accent</Label>
              <div className="flex gap-2">
                <input type="color" value={accent} onChange={e => update('accent_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={accent} onChange={e => update('accent_color', e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Фон</Label>
              <div className="flex gap-2">
                <input type="color" value={bg} onChange={e => update('bg_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={bg} onChange={e => update('bg_color', e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Текст</Label>
              <div className="flex gap-2">
                <input type="color" value={text} onChange={e => update('text_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={text} onChange={e => update('text_color', e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero (обложка)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Стиль hero</Label>
              <Select value={config.hero_style ?? 'full'} onValueChange={v => update('hero_style', v as ReleaseDesignConfig['hero_style'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(heroLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Overlay</Label>
              <Select value={config.hero_overlay ?? 'gradient'} onValueChange={v => update('hero_overlay', v as ReleaseDesignConfig['hero_overlay'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(overlayLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Макет страницы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={config.layout ?? 'narrow'} onValueChange={v => update('layout', v as ReleaseDesignConfig['layout'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(layoutLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.show_toc ?? true} onChange={e => update('show_toc', e.target.checked)} className="size-4 rounded" />
              Оглавление
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.show_characters ?? true} onChange={e => update('show_characters', e.target.checked)} className="size-4 rounded" />
              Персонажи
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.show_series ?? true} onChange={e => update('show_series', e.target.checked)} className="size-4 rounded" />
              Серия
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Превью</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border p-6 transition-all"
            style={{ backgroundColor: bg, color: text }}
          >
            {release.cover_image && (
              <div
                className="mb-4 rounded overflow-hidden"
                style={{
                  height: config.hero_style === 'full' ? '120px' : config.hero_style === 'centered' ? '80px' : '40px',
                  backgroundImage: `url(${release.cover_image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {config.hero_overlay !== 'none' && (
                  <div
                    className="h-full"
                    style={{
                      background: config.hero_overlay === 'dark' ? 'rgba(0,0,0,0.5)' : `linear-gradient(to bottom, transparent, ${bg})`,
                    }}
                  />
                )}
              </div>
            )}
            <h3 className="text-lg font-bold" style={{ color: accent }}>{release.title}</h3>
            {release.annotation && <p className="mt-2 text-sm opacity-70">{release.annotation.slice(0, 100)}...</p>}
            {config.layout === 'sidebar' && (
              <div className="mt-3 text-xs opacity-50">☰ Sidebar с главами</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Сохраняю...' : 'Сохранить дизайн'}
        </Button>
      </div>
    </div>
  )
}