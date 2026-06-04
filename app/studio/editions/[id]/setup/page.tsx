import { notFound } from 'next/navigation'
import { getEditionSetupData } from '@/lib/actions/studio'
import { EditionSetupPage } from '@/components/studio/edition-setup-page'

export default async function EditionSetupPageRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getEditionSetupData(id)
  if (!data) notFound()

  return <EditionSetupPage data={data} />
}