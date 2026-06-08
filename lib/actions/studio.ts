'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStudioSession } from '@/lib/server/studio-auth'
import * as releasesDb from '@/lib/server/releases'
import * as editionsDb from '@/lib/server/editions'
import * as chaptersDb from '@/lib/server/chapters'
import * as seriesDb from '@/lib/server/series'
import { dbQuery } from '@/lib/db'
import type { ReleaseCharacterRole, ReleaseDesignConfig } from '@/lib/releases-types'

async function requireAuth() {
  const session = await requireStudioSession()
  if (!session) redirect('/login')
  return session
}

// === Releases ===

export async function getMyReleases() {
  const { user } = await requireAuth()
  return releasesDb.listReleasesByAuthor(user.id)
}

export async function getRelease(id: string) {
  await requireAuth()
  return releasesDb.fetchReleaseById(id)
}

export async function createReleaseAction(formData: FormData) {
  const { user } = await requireAuth()

  const release = await releasesDb.createRelease({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    cover_image: formData.get('cover_image') || null,
    genre: formData.get('genre') || null,
    release_date: formData.get('release_date') || null,
    isbn: formData.get('isbn') || null,
    authors: JSON.parse(formData.get('authors') as string || '[]'),
    annotation: formData.get('annotation') || null,
    editor_notes: formData.get('editor_notes') || null,
    status: 'draft',
  })

  if (release) {
    await dbQuery(
      `INSERT INTO release_collaborators (release_id, user_id, role) VALUES ($1, $2, 'owner'::collaborator_role)`,
      [release.id, user.id],
    )
  }

  revalidatePath('/studio')
  if (release) redirect(`/studio/releases/${release.id}`)
}

export async function updateReleaseAction(id: string, formData: FormData) {
  await requireAuth()

  await releasesDb.updateRelease(id, {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    cover_image: formData.get('cover_image') || null,
    genre: formData.get('genre') || null,
    release_date: formData.get('release_date') || null,
    isbn: formData.get('isbn') || null,
    authors: JSON.parse(formData.get('authors') as string || '[]'),
    annotation: formData.get('annotation') || null,
    editor_notes: formData.get('editor_notes') || null,
    status: formData.get('status') || 'draft',
  })

  revalidatePath(`/studio/releases/${id}`)
}

export async function updateReleaseStatusAction(id: string, status: string) {
  await requireAuth()
  await releasesDb.updateReleaseStatus(id, status)
  revalidatePath(`/studio/releases/${id}`)
  revalidatePath('/studio')
}

export async function deleteReleaseAction(id: string) {
  await requireAuth()
  await releasesDb.deleteRelease(id)
  revalidatePath('/studio')
  redirect('/studio')
}

export async function updateReleaseDesignAction(id: string, config: ReleaseDesignConfig) {
  await requireAuth()
  await releasesDb.updateReleaseDesign(id, config as Record<string, unknown>)
  revalidatePath(`/studio/releases/${id}`)
  revalidatePath(`/release/${id}`)
}

// === Editions ===

export async function getEditions(releaseId: string) {
  await requireAuth()
  return editionsDb.fetchEditionsByRelease(releaseId)
}

export async function getEdition(id: string) {
  await requireAuth()
  return editionsDb.fetchEditionById(id)
}

export async function createEditionAction(formData: FormData) {
  await requireAuth()

  const edition = await editionsDb.createEdition({
    release_id: formData.get('release_id'),
    format: formData.get('format') || 'book',
    platform: formData.get('platform') || null,
    external_url: formData.get('external_url') || null,
    slug: formData.get('slug'),
    status: 'draft',
    is_primary: formData.get('is_primary') === 'true',
  })

  const releaseId = formData.get('release_id') as string
  revalidatePath(`/studio/releases/${releaseId}`)
  if (edition) redirect(`/studio/editions/${edition.id}/setup`)
}


export async function updateEditionStatusAction(id: string, status: string) {
  await requireAuth()
  await editionsDb.updateEditionStatus(id, status)
  const edition = await editionsDb.fetchEditionById(id)
  if (edition) {
    revalidatePath(`/studio/editions/${id}`)
    revalidatePath(`/studio/releases/${edition.release_id}`)
  }
}

export async function deleteEditionAction(id: string, releaseId: string) {
  await requireAuth()
  await editionsDb.deleteEdition(id)
  revalidatePath(`/studio/releases/${releaseId}`)
  redirect(`/studio/releases/${releaseId}`)
}

// === Chapters ===

export async function getChapters(editionId: string) {
  await requireAuth()
  return chaptersDb.fetchChaptersByEdition(editionId)
}

export async function getChapter(id: string) {
  await requireAuth()
  return chaptersDb.fetchChapterById(id)
}

export async function createChapterAction(formData: FormData) {
  await requireAuth()

  const editionId = formData.get('edition_id') as string
  const existing = await chaptersDb.fetchChaptersByEdition(editionId)
  const nextIndex = existing.length > 0
    ? Math.max(...existing.map(c => c.chapter_index)) + 1
    : 1

  const chapter = await chaptersDb.createChapter({
    edition_id: editionId,
    title: formData.get('title') || `Глава ${nextIndex}`,
    content: null,
    chapter_index: nextIndex,
    status: 'draft',
    word_count: 0,
  })

  revalidatePath(`/studio/editions/${editionId}`)
  if (chapter) redirect(`/studio/editions/${editionId}/chapters/${chapter.id}`)
}

export async function updateChapterAction(id: string, data: { title?: string; content?: string; chapter_index?: number }) {
  await requireAuth()

  const chapter = await chaptersDb.fetchChapterById(id)
  if (!chapter) return null

  const wordCount = data.content
    ? data.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
    : chapter.word_count

  if (data.content && chapter.content && data.content !== chapter.content) {
    await chaptersDb.createChapterVersion(id, chapter.content)
  }

  const updated = await chaptersDb.updateChapter(id, {
    title: data.title ?? chapter.title,
    content: data.content ?? chapter.content,
    chapter_index: data.chapter_index ?? chapter.chapter_index,
    status: chapter.status,
    word_count: wordCount,
  })

  revalidatePath(`/studio/editions/${chapter.edition_id}`)
  return updated
}

export async function publishChapterAction(id: string) {
  await requireAuth()
  const chapter = await chaptersDb.publishChapter(id)
  if (chapter) revalidatePath(`/studio/editions/${chapter.edition_id}`)
  return chapter
}

export async function deleteChapterAction(id: string) {
  await requireAuth()
  const chapter = await chaptersDb.fetchChapterById(id)
  if (!chapter) return
  await chaptersDb.deleteChapter(id)
  revalidatePath(`/studio/editions/${chapter.edition_id}`)
  redirect(`/studio/editions/${chapter.edition_id}`)
}

// === Chapter Versions ===

export async function getChapterVersions(chapterId: string) {
  await requireAuth()
  return chaptersDb.fetchChapterVersions(chapterId)
}

export async function restoreChapterVersionAction(chapterId: string, versionId: string) {
  await requireAuth()
  const chapter = await chaptersDb.restoreChapterVersion(chapterId, versionId)
  if (chapter) revalidatePath(`/studio/editions/${chapter.edition_id}/chapters/${chapterId}`)
  return chapter
}

// === Series ===

export async function getAllSeries() {
  await requireAuth()
  return seriesDb.fetchAllSeries()
}

export async function createSeriesAction(formData: FormData) {
  await requireAuth()
  await seriesDb.createSeries({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
  })
  revalidatePath('/studio/series')
}

export async function updateSeriesAction(id: string, formData: FormData) {
  await requireAuth()
  await seriesDb.updateSeries(id, {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
  })
  revalidatePath('/studio/series')
}

export async function deleteSeriesAction(id: string) {
  await requireAuth()
  await seriesDb.deleteSeries(id)
  revalidatePath('/studio/series')
}

// === Edition Setup ===

export async function getEditionSetupData(editionId: string) {
  await requireAuth()
  const edition = await editionsDb.fetchEditionById(editionId)
  if (!edition) return null

  const release = await releasesDb.fetchReleaseById(edition.release_id)
  const characters = await dbQuery<{ id: string; name: string; slug: string; avatar: string | null }>(
    'SELECT id, name, slug, avatar FROM characters ORDER BY name ASC',
  )
  const series = await seriesDb.fetchAllSeries()

  const releaseCharacters = release
    ? await releasesDb.fetchReleaseCharacters(release.id)
    : []
  const releaseSeriesLinks = release
    ? await releasesDb.fetchReleaseSeries(release.id)
    : []

  return {
    edition,
    release,
    characters,
    series,
    releaseCharacters,
    releaseSeriesLinks,
  }
}

export async function updateEditionSetupAction(
  editionId: string,
  data: {
    slug?: string
    platform?: string | null
    external_url?: string | null
    cover_image?: string | null
    annotation?: string | null
    character_ids?: { character_id: string; role: string }[]
    series_links?: { series_id: string; phase_number: number | null }[]
  },
) {
  await requireAuth()
  const edition = await editionsDb.fetchEditionById(editionId)
  if (!edition) return null

  await editionsDb.updateEdition(editionId, {
    format: edition.format,
    platform: data.platform ?? edition.platform,
    external_url: data.external_url ?? edition.external_url,
    slug: data.slug ?? edition.slug,
    status: edition.status,
  })

  if (data.cover_image !== undefined || data.annotation !== undefined) {
    const release = await releasesDb.fetchReleaseById(edition.release_id)
    if (release) {
      await releasesDb.updateRelease(release.id, {
        title: release.title,
        slug: release.slug,
        description: release.description,
        cover_image: data.cover_image ?? release.cover_image,
        genre: release.genre,
        release_date: release.release_date,
        isbn: release.isbn,
        authors: release.authors,
        annotation: data.annotation ?? release.annotation,
        editor_notes: release.editor_notes,
        status: release.status,
      })
    }
  }

  if (data.character_ids) {
    await releasesDb.setReleaseCharacters(edition.release_id, data.character_ids as { character_id: string; role: ReleaseCharacterRole }[])
  }

  if (data.series_links) {
    await releasesDb.setReleaseSeries(edition.release_id, data.series_links)
  }

  revalidatePath(`/studio/editions/${editionId}`)
  revalidatePath(`/studio/editions/${editionId}/setup`)
  revalidatePath(`/studio/releases/${edition.release_id}`)
}
