import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CharacterPostComposer } from '@/components/studio/character-post-composer'
import { getStudioCharacter } from '@/lib/actions/studio-characters'
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
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50/50">
          <Link href={`/studio/characters/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К персонажу
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Редактирование поста</h1>
      </div>
      <CharacterPostComposer characterId={id} post={post} />
    </div>
  )
}