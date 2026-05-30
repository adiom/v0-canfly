import { notFound } from 'next/navigation'
import { getEdition, getChapters } from '@/lib/actions/studio'
import { EditionPageClient } from '@/components/studio/edition-page-client'

export default async function EditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [edition, chapters] = await Promise.all([
    getEdition(id),
    getChapters(id),
  ])
  if (!edition) notFound()

  return <EditionPageClient edition={edition} chapters={chapters} />
}
