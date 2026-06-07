import Link from 'next/link'
import { Plus, MessageSquareOff, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudioCharacters } from '@/lib/actions/studio-characters'
import type { CharacterReplyMode } from '@/lib/types'

export const dynamic = 'force-dynamic'

const REPLY_MODE_LABELS: Record<CharacterReplyMode, { label: string; tone: string }> = {
  ai_auto: { label: 'AI авто', tone: 'bg-[#d52525]/15 text-[#d52525] border-[#d52525]/30' },
  manual: { label: 'Вручную', tone: 'bg-[#f6d6a8]/15 text-[#f6d6a8] border-[#f6d6a8]/30' },
  hybrid: { label: 'AI + проверка', tone: 'bg-[#9db5c8]/15 text-[#9db5c8] border-[#9db5c8]/30' },
  disabled: { label: 'Отключено', tone: 'bg-[#f4efe5]/5 text-[#ded7cc]/60 border-[#f4efe5]/10' },
}

export default async function StudioCharactersPage() {
  const characters = await getStudioCharacters()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#f4efe5]/10 bg-[#1b1c19]">
            <Users className="h-5 w-5 text-[#f6d6a8]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d52525]">
              студия
            </p>
            <h1 className="text-2xl font-black uppercase text-[#f4efe5]">Персонажи</h1>
            <p className="text-sm text-[#ded7cc]/70">
              {characters.length > 0
                ? `${characters.length} ${pluralize(characters.length, ['персонаж', 'персонажа', 'персонажей'])}`
                : 'Создание и редактирование персонажей вселенной'}
            </p>
          </div>
        </div>
        <Button asChild className="h-11 bg-[#d52525] px-5 font-black uppercase hover:bg-[#b91f1f]">
          <Link href="/studio/characters/new">
            <Plus className="mr-2 h-4 w-4" />
            Новый персонаж
          </Link>
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className="border-dashed border-[#f4efe5]/15 bg-[#1b1c19] p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-[#f4efe5]/10">
            <Users className="h-7 w-7 text-[#ded7cc]/40" />
          </div>
          <h2 className="mb-2 text-lg font-black uppercase text-[#f4efe5]">
            Персонажей пока нет
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-[#ded7cc]/60">
            Создайте первого героя, чтобы он появился в каталоге, на странице «Персонажи» и
            в ленте активности.
          </p>
          <Button asChild className="bg-[#d52525] hover:bg-[#b91f1f]">
            <Link href="/studio/characters/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать первого
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      )}
    </div>
  )
}

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

function CharacterCard({
  character,
}: {
  character: Awaited<ReturnType<typeof getStudioCharacters>>[number]
}) {
  const reply = REPLY_MODE_LABELS[character.reply_mode]
  return (
    <Link
      href={`/studio/characters/${character.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d52525] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210]"
    >
      <Card className="flex h-full flex-col border-[#f4efe5]/10 bg-[#1b1c19] p-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[#f6d6a8]/45">
        <div className="relative">
          <div className="h-20 bg-gradient-to-br from-[#d52525]/60 via-[#7a1818]/50 to-[#1b1c19]" />
          <div className="absolute -bottom-10 left-5">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-[#1b1c19] bg-[#111210] shadow-lg">
              {character.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black uppercase text-[#f4efe5]/40">
                  {character.name[0]}
                </div>
              )}
            </div>
          </div>
          {!character.can_receive_messages ? (
            <div className="absolute right-3 top-3 flex items-center gap-1 border border-[#f4efe5]/10 bg-[#111210]/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ded7cc]/70 backdrop-blur">
              <MessageSquareOff className="h-3 w-3" />
              Тихий
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-12">
          <div className="mb-3">
            <h3 className="truncate text-lg font-black uppercase text-[#f4efe5] group-hover:text-[#f6d6a8]">
              {character.name}
            </h3>
            <p className="truncate text-xs uppercase tracking-[0.12em] text-[#ded7cc]/50">
              @{character.slug}
            </p>
          </div>

          {character.bio ? (
            <p className="mb-4 line-clamp-3 text-sm leading-6 text-[#ded7cc]/80">
              {character.bio}
            </p>
          ) : (
            <p className="mb-4 line-clamp-3 text-sm italic leading-6 text-[#ded7cc]/30">
              Описание не заполнено
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${reply.tone}`}
            >
              {reply.label}
            </Badge>
            {character.abilities && character.abilities.length > 0 ? (
              <Badge
                variant="outline"
                className="border-[#f4efe5]/10 bg-[#f4efe5]/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#ded7cc]/70"
              >
                ⚡ {character.abilities.length}
              </Badge>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}
