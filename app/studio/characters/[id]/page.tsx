import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Plus, Trash2, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  deleteCharacterAction,
  getStudioCharacter,
  listStudioCharacterPosts,
  listStudioWallPosts,
} from '@/lib/actions/studio-characters'
import { CharacterPostsTable } from '@/components/studio/character-posts-table'
import { CharacterWallModeration } from '@/components/studio/character-wall-moderation'

export const dynamic = 'force-dynamic'

const replyModeBadgeStyles: Record<string, string> = {
  ai_auto: 'bg-violet-50 text-violet-600 border-violet-200/80',
  manual: 'bg-amber-50 text-amber-600 border-amber-200/80',
  hybrid: 'bg-sky-50 text-sky-600 border-sky-200/80',
  disabled: 'bg-gray-100 text-gray-400 border-gray-200/80',
}

const replyModeLabels: Record<string, string> = {
  ai_auto: 'AI авто',
  manual: 'Вручную',
  hybrid: 'AI + проверка',
  disabled: 'Отключено',
}

export default async function StudioCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const character = await getStudioCharacter(id)
  if (!character) notFound()

  const [posts, wallPosts] = await Promise.all([
    listStudioCharacterPosts(id),
    listStudioWallPosts(id),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-3 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50/50">
          <Link href="/studio/characters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-rose-50 shadow-lg shadow-black/5 ring-2 ring-white/80">
              {character.avatar ? (
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-violet-400">
                  {character.name[0]}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{character.name}</h1>
              <p className="text-sm text-gray-400">@{character.slug}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="outline" className={`border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-lg ${replyModeBadgeStyles[character.reply_mode]}`}>
                  {replyModeLabels[character.reply_mode]}
                </Badge>
                {character.can_receive_messages ? null : (
                  <Badge variant="outline" className="border-gray-200/80 bg-gray-50 text-gray-400 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-lg">
                    Сообщения отключены
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl border-white/70 bg-white/60 text-gray-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200">
              <Link href={`/characters/${character.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Профиль
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-white/70 bg-white/60 text-gray-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200">
              <Link href={`/studio/characters/${character.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200/80 transition-colors hover:bg-red-100 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white/80 backdrop-blur-xl border-white/70 rounded-2xl shadow-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Удалить персонажа?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие необратимо. Все связи, посты и стена будут удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                  <form action={deleteCharacterAction.bind(null, character.id)}>
                    <AlertDialogAction type="submit" className="rounded-xl bg-red-600 text-white">Удалить</AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="bg-white/60 backdrop-blur-md border border-white/70 rounded-xl shadow-sm">
          <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-violet-100/80 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm text-gray-500">
            Посты ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="wall" className="rounded-lg data-[state=active]:bg-violet-100/80 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm text-gray-500">
            Стена ({wallPosts.length})
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-violet-100/80 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm text-gray-500">
            О персонаже
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">
              <Link href={`/studio/characters/${character.id}/posts/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Новый пост
              </Link>
            </Button>
          </div>
          <CharacterPostsTable characterId={character.id} posts={posts} />
        </TabsContent>

        <TabsContent value="wall">
          <CharacterWallModeration wallPosts={wallPosts} />
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm shadow-black/5 p-5 md:p-6">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-gray-600">Био</dt>
                <dd className="mt-1 whitespace-pre-wrap text-gray-900">{character.bio || '—'}</dd>
              </div>
              {character.full_description ? (
                <div>
                  <dt className="font-semibold text-gray-600">Полное описание</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-gray-900">{character.full_description}</dd>
                </div>
              ) : null}
              {character.abilities?.length ? (
                <div>
                  <dt className="font-semibold text-gray-600">Способности</dt>
                  <dd className="mt-1">
                    <ul className="list-disc pl-5 text-gray-700">
                      {character.abilities.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}