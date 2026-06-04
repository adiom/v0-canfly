'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Edition, Release, ReleaseCharacter, ReleaseSeries, Series } from '@/lib/releases-types'
import { updateEditionSetupAction } from '@/lib/actions/studio'
import { generateSlug } from '@/lib/slug-utils'
import { ComicPagesEditor } from '@/components/studio/comic-pages-editor'
import { AudioTracksEditor } from '@/components/studio/audio-tracks-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, BookOpen, Image, Headphones, Radio, Newspaper } from 'lucide-react'

const formatLabels: Record<string, string> = {
  book: 'Книга',
  comic: 'Комикс',
  audiobook: 'Аудиокнига',
  audiorelease: 'Аудиорелиз',
  magazine: 'Журнал',
}

const formatIcons: Record<string, React.ElementType> = {
  book: BookOpen,
  comic: Image,
  audiobook: Headphones,
  audiorelease: Radio,
  magazine: Newspaper,
}

interface SetupData {
  edition: Edition
  release: Release | null
  characters: { id: string; name: string; slug: string; avatar: string | null }[]
  series: Series[]
  releaseCharacters: ReleaseCharacter[]
  releaseSeriesLinks: ReleaseSeries[]
}

export function EditionSetupPage({ data }: { data: SetupData }) {
  const router = useRouter()
  const { edition, release, characters, series, releaseCharacters, releaseSeriesLinks } = data
  const Icon = formatIcons[edition.format] ?? BookOpen

  const [slug, setSlug] = useState(edition.slug)
  const [platform, setPlatform] = useState(edition.platform ?? '')
  const [externalUrl, setExternalUrl] = useState(edition.external_url ?? '')
  const [coverImage, setCoverImage] = useState(release?.cover_image ?? '')
  const [annotation, setAnnotation] = useState(release?.annotation ?? '')
  const [selectedCharacters, setSelectedCharacters] = useState<{ character_id: string; role: string }[]>(
    releaseCharacters.map(rc => ({ character_id: rc.character_id, role: rc.role }))
  )
  const [seriesLink, setSeriesLink] = useState<{
    series_id: string | null
    phase_number: number | null
  }>({
    series_id: releaseSeriesLinks.length > 0 ? releaseSeriesLinks[0].series_id : null,
    phase_number: releaseSeriesLinks.length > 0 ? releaseSeriesLinks[0].phase_number : null,
  })
  const [saving, setSaving] = useState(false)

  const toggleCharacter = (characterId: string, role: string) => {
    setSelectedCharacters(prev => {
      const existing = prev.find(c => c.character_id === characterId)
      if (existing) {
        if (existing.role === role) {
          return prev.filter(c => c.character_id !== characterId)
        }
        return prev.map(c => c.character_id === characterId ? { ...c, role } : c)
      }
      return [...prev, { character_id: characterId, role }]
    })
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const seriesLinks = seriesLink.series_id
        ? [{ series_id: seriesLink.series_id, phase_number: seriesLink.phase_number }]
        : []

      await updateEditionSetupAction(edition.id, {
        slug,
        platform: platform || null,
        external_url: externalUrl || null,
        cover_image: coverImage || null,
        annotation: annotation || null,
        character_ids: selectedCharacters,
        series_links: seriesLinks,
      })
      toast.success('Настройки сохранены')
      router.push(`/studio/editions/${edition.id}`)
      router.refresh()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }, [edition.id, slug, platform, externalUrl, coverImage, annotation, selectedCharacters, seriesLink, router])

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/studio/releases/${edition.release_id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{formatLabels[edition.format]}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {release?.title ?? 'Релиз'} — настройка издания
          </p>
        </div>
        <Badge variant="secondary">{edition.status}</Badge>
      </div>

      <div className="space-y-8">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  onBlur={() => {
                    if (!slug.trim()) setSlug(generateSlug(formatLabels[edition.format]))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Платформа</Label>
                <Input
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  placeholder="Litres, Bookmate..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Внешняя ссылка</Label>
              <Input
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Обложка (URL)</Label>
              <Input
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Аннотация</Label>
              <textarea
                value={annotation}
                onChange={e => setAnnotation(e.target.value)}
                rows={4}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Описание произведения..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label>Персонажи</Label>
              <p className="text-xs text-muted-foreground">
                Выберите персонажей и их роль в произведении
              </p>
              {characters.length > 0 ? (
                <div className="grid max-h-72 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                  {characters.map(character => {
                    const selected = selectedCharacters.find(c => c.character_id === character.id)
                    return (
                      <div key={character.id} className="flex items-start gap-2 rounded-md px-2 py-2">
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={() => toggleCharacter(character.id, selected?.role ?? 'supporting')}
                          className="mt-1 size-4 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block font-medium">{character.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">/{character.slug}</span>
                        </div>
                        {selected && (
                          <Select
                            value={selected.role}
                            onValueChange={role => toggleCharacter(character.id, role)}
                          >
                            <SelectTrigger className="h-7 w-auto text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="main">Главный</SelectItem>
                              <SelectItem value="supporting">Второстепенный</SelectItem>
                              <SelectItem value="cameo">Камео</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Персонажи пока не добавлены</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label>Серия</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  value={seriesLink.series_id ?? ''}
                  onValueChange={v => setSeriesLink(prev => ({ ...prev, series_id: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите серию" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Фаза (номер)"
                  value={seriesLink.phase_number ?? ''}
                  onChange={e => setSeriesLink(prev => ({
                    ...prev,
                    phase_number: e.target.value ? Number(e.target.value) : null,
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {edition.format === 'comic' && (
          <Card>
            <CardContent className="pt-6">
              <ComicPagesEditor editionId={edition.id} />
            </CardContent>
          </Card>
        )}

        {(edition.format === 'audiobook' || edition.format === 'audiorelease') && (
          <Card>
            <CardContent className="pt-6">
              <AudioTracksEditor editionId={edition.id} />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push(`/studio/releases/${edition.release_id}`)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Сохраняю...' : 'Сохранить и перейти к главам'}
          </Button>
        </div>
      </div>
    </div>
  )
}