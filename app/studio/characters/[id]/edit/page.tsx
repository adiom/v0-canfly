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
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50/50">
          <Link href={`/studio/characters/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К персонажу
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{character.name}</h1>
        <p className="text-sm text-gray-400">Редактирование</p>
      </div>
      <CharacterForm character={character} />
    </div>
  )
}