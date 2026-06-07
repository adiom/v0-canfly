import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-3">
          <Link href="/studio/characters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
              {character.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                  {character.name[0]}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{character.name}</h1>
              <p className="text-sm text-muted-foreground">@{character.slug}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">{character.reply_mode}</Badge>
                {character.can_receive_messages ? null : (
                  <Badge variant="outline">Сообщения отключены</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/characters/${character.slug}`} target="_blank">
                Профиль
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/studio/characters/${character.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive text-white transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40">
                <Trash2 className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить персонажа?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие необратимо. Все связи, посты и стена будут удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <form action={deleteCharacterAction.bind(null, character.id)}>
                    <AlertDialogAction type="submit">Удалить</AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Посты ({posts.length})</TabsTrigger>
          <TabsTrigger value="wall">Стена ({wallPosts.length})</TabsTrigger>
          <TabsTrigger value="about">О персонаже</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild>
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
          <Card className="p-6">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Био</dt>
                <dd className="mt-1 whitespace-pre-wrap">{character.bio || '—'}</dd>
              </div>
              {character.full_description ? (
                <div>
                  <dt className="font-medium text-muted-foreground">Полное описание</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{character.full_description}</dd>
                </div>
              ) : null}
              {character.abilities?.length ? (
                <div>
                  <dt className="font-medium text-muted-foreground">Способности</dt>
                  <dd className="mt-1">
                    <ul className="list-disc pl-5">
                      {character.abilities.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
