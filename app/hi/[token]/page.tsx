import { redirect } from 'next/navigation'
import { validateAndConsumeMagicToken } from '@/lib/server/magic-token'
import { ClientMagicLinkSection } from './client-magic-link-section'

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function MagicLinkPage({ params }: PageProps) {
  const { token } = await params

  if (!token) {
    redirect('/login?error=invalid_token')
  }

  const data = await validateAndConsumeMagicToken(token)

  if (!data) {
    redirect('/login?error=invalid_token')
  }

  const { email } = data

  return (
    <main className="min-h-screen bg-[#111210] text-[#f4efe5] flex items-center justify-center">
      <div className="border border-[#f4efe5]/10 bg-[#1b1c19] p-8 text-center max-w-md">
        <h1 className="text-2xl font-black uppercase tracking-[0.06em]">Вход выполнен</h1>
        <p className="mt-4 text-sm text-[#ded7cc]">
          Почта: <span className="text-[#f4efe5] font-bold">{email}</span>
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#ded7cc]/60">
          Перенаправление через 3 секунды...
        </p>
        <a
          href={`/login?magic_email=${encodeURIComponent(email)}`}
          className="mt-4 inline-block text-xs text-[#f6d6a8] hover:underline"
        >
          Нажмите здесь, если редирект не произошёл
        </a>
      </div>
      <ClientMagicLinkSection email={email} />
    </main>
  )
}
