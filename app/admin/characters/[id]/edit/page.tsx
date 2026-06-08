import { AdminShell } from '@/app/admin/_components/admin-shell'
import { CharacterForm } from '@/app/admin/_components/character-form'

interface EditCharacterPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCharacterPage({ params }: EditCharacterPageProps) {
  const { id } = await params

  return (
    <AdminShell title="Редактирование персонажа" description="Обновление имени, описаний, способностей и изображения.">
      <CharacterForm characterId={id} />
    </AdminShell>
  )
}

