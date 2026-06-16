import { notFound } from 'next/navigation'
import { getChapter } from '@/lib/actions/studio'
import { fetchEditionById } from '@/lib/server/editions'
import { ChapterEditorPage } from '@/components/studio/chapter-editor-page'

export default async function ChapterEditPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>
}) {
  const { id: editionId, chapterId } = await params
  const chapter = await getChapter(chapterId)
  if (!chapter) notFound()
  if (chapter.edition_id !== editionId) notFound()

  const edition = await fetchEditionById(editionId)
  if (!edition) notFound()

  return <ChapterEditorPage chapter={chapter} editionId={editionId} editionFormat={edition.format} />
}
