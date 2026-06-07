import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CharacterForm } from '@/components/studio/character-form'

export default function NewCharacterPage() {
  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3">
          <Link href="/studio/characters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Новый персонаж</h1>
      </div>
      <CharacterForm />
    </div>
  )
}
