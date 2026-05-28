import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, UserRound } from 'lucide-react'

import { getCurrentUserFromCookie, fetchReaderProfileSummary } from '@/lib/server/users'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Профиль читателя | canfly',
  description: 'Личный профиль читателя canfly: роли, персонажи-друзья и диалоги.',
}

export default async function ProfilePage() {
  const user = await getCurrentUserFromCookie()
  const summary = user ? await fetchReaderProfileSummary(user.id) : null

  return (
    <main className="min-h-screen bg-[#111210] text-[#f4efe5]">
      <header className="border-b border-[#f4efe5]/10 bg-[#111210]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <Link href="/" className="text-xl font-black uppercase tracking-[0.18em] text-[#f4efe5]">
            canfly
          </Link>
          <Link href="/characters" className="text-xs font-bold uppercase tracking-[0.18em] text-[#ded7cc]">
            Персонажи
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-10 flex flex-col gap-6 border-b border-[#f4efe5]/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[#f4efe5]/10 bg-[#1b1c19]">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.display_name} width={80} height={80} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <UserRound className="h-9 w-9 text-[#d7c6ad]" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7c6ad]">Профиль</p>
              <h1 className="mt-2 text-4xl font-black uppercase md:text-5xl">
                {user?.display_name || 'Читатель canfly'}
              </h1>
              <p className="mt-2 text-sm text-[#ded7cc]">
                {user
                  ? user.login
                    ? `login: ${user.login}`
                    : `@${user.handle}`
                  : 'Профиль появится после входа, добавления персонажа в друзья или первого диалога.'}
              </p>
            </div>
          </div>

          {summary ? (
            <div className="flex flex-wrap gap-2">
              {summary.roles.map((role) => (
                <span
                  key={role}
                  className="border border-[#f4efe5]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f6d6a8]"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {!user || !summary ? (
          <div className="max-w-2xl border border-[#f4efe5]/10 bg-[#1b1c19] p-6">
            <h2 className="text-2xl font-black uppercase">Пока пусто</h2>
            <p className="mt-3 leading-7 text-[#ded7cc]">
              Добавь персонажа в друзья или начни чат, и здесь появятся твои связи, роли и история диалогов.
            </p>
            <Button asChild className="mt-6 h-12 bg-[#d52525] px-5 text-sm font-black uppercase text-white hover:bg-[#b91f1f]">
              <Link href="/login">Войти или создать профиль</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase">Персонажи-друзья</h2>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#9db5c8]">
                  {summary.friendships.length}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {summary.friendships.map((friendship) => (
                  <Link
                    key={friendship.id}
                    href={`/characters/${friendship.character_slug}`}
                    className="group border border-[#f4efe5]/10 bg-[#1b1c19] p-4 transition-colors hover:border-[#f6d6a8]/45"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[#f4efe5]/10 bg-[#111210]">
                        {friendship.character_avatar ? (
                          <Image
                            src={friendship.character_avatar}
                            alt={friendship.character_name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <h3 className="font-black uppercase group-hover:text-[#f6d6a8]">
                          {friendship.character_name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#ded7cc]">
                          {friendship.character_bio || 'Персонаж canfly'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-1 bg-[#111210]">
                      <div
                        className="h-full bg-[#d52525]"
                        style={{ width: `${Math.min(friendship.intimacy_level, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#d7c6ad]">
                      Близость {friendship.intimacy_level}/100
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-5 text-2xl font-black uppercase">Диалоги</h2>
              <div className="space-y-3">
                {summary.conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/characters/${conversation.character_slug}/chat`}
                    className="flex gap-4 border border-[#f4efe5]/10 bg-[#1b1c19] p-4 transition-colors hover:border-[#f6d6a8]/45"
                  >
                    <MessageCircle className="mt-1 h-5 w-5 flex-shrink-0 text-[#9db5c8]" />
                    <div>
                      <h3 className="font-black uppercase">{conversation.character_name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#ded7cc]">
                        {conversation.last_message || 'Диалог создан. Напиши первое сообщение.'}
                      </p>
                    </div>
                  </Link>
                ))}

                {summary.conversations.length === 0 ? (
                  <p className="border border-[#f4efe5]/10 bg-[#1b1c19] p-4 text-sm text-[#ded7cc]">
                    Диалогов пока нет.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}
