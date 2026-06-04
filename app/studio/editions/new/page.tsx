import { redirect } from 'next/navigation'
import { requireStudioSession } from '@/lib/server/studio-auth'
import { EditionFormatSelector } from '@/components/studio/edition-format-selector'

export default async function NewEditionPage({
  searchParams,
}: {
  searchParams: Promise<{ releaseId?: string }>
}) {
  const session = await requireStudioSession()
  if (!session) redirect('/login')

  const { releaseId } = await searchParams
  if (!releaseId) redirect('/studio')

  return <EditionFormatSelector releaseId={releaseId} />
}