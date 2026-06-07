import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CharacterForm } from '@/components/studio/character-form'
import { getStudioCharacter } from '@/lib/actions/studio-characters'

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const character = await getStudioCharacter(id)
  if (!character) notFound()

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3">
          <Link href={`/studio/characters/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К персонажу
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{character.name}</h1>
        <p className="text-sm text-muted-foreground">Редактирование</p>
      </div>
      <CharacterForm character={character} />
    </div>
  )
}
