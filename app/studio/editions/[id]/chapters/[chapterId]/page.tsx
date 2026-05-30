import { notFound } from 'next/navigation'
import { getChapter } from '@/lib/actions/studio'
import { ChapterEditorPage } from '@/components/studio/chapter-editor-page'

export default async function ChapterEditPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>
}) {
  const { id: editionId, chapterId } = await params
  const chapter = await getChapter(chapterId)
  if (!chapter) notFound()

  return <ChapterEditorPage chapter={chapter} editionId={editionId} />
}
