import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CharacterForm } from '@/components/studio/character-form'

interface NewCharacterPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function NewCharacterPage({ searchParams }: NewCharacterPageProps) {
  const { type } = await searchParams
  const characterType = type === 'city' ? 'city' : 'person'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50/50">
          <Link href="/studio/characters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {characterType === 'city' ? 'Новый город' : 'Новый персонаж'}
        </h1>
      </div>
      <CharacterForm characterType={characterType} />
    </div>
  )
}
