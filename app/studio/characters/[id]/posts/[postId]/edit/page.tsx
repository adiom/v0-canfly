import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CharacterPostComposer } from '@/components/studio/character-post-composer'
import {
  getStudioCharacter,
} from '@/lib/actions/studio-characters'
import { fetchCharacterPostById } from '@/lib/server/character-posts'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>
}) {
  const { id, postId } = await params
  const [character, post] = await Promise.all([
    getStudioCharacter(id),
    fetchCharacterPostById(postId),
  ])
  if (!character) notFound()
  if (!post || post.character_id !== id) notFound()

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3">
          <Link href={`/studio/characters/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К персонажу
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Редактирование поста</h1>
      </div>
      <CharacterPostComposer characterId={id} post={post} />
    </div>
  )
}
