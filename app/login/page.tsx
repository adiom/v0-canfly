'use client'

import { Suspense, useEffect, useState, startTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

import { MagicLinkForm } from '@/components/magic-link-form'
import { Button } from '@/components/ui/button'
import { loginWithMagicLink, type LoginActionState } from '@/app/(auth)/actions'
import { useActionState } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, update: updateSession } = useSession()
  const [loginTriggered, setLoginTriggered] = useState(false)
  const [successHandled, setSuccessHandled] = useState(false)

  const [magicState, magicFormAction] = useActionState<LoginActionState, FormData>(
    loginWithMagicLink,
    { status: 'idle' },
  )

  // Редирект если уже авторизован
  useEffect(() => {
    if (status === 'authenticated' && !successHandled) {
      setSuccessHandled(true)
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [status, successHandled, router, searchParams])

  // Автоматический вход после перехода по magic link (/login?magic_email=...)
  useEffect(() => {
    if (loginTriggered) return
    const magicEmail = searchParams.get('magic_email')
    if (!magicEmail) return

    setLoginTriggered(true)
    const formData = new FormData()
    formData.append('email', magicEmail)
    startTransition(() => {
      magicFormAction(formData)
    })
  }, [searchParams, magicFormAction, loginTriggered])

  // После успешного входа через credentials
  useEffect(() => {
    if (magicState.status === 'success' && !successHandled) {
      setSuccessHandled(true)
      updateSession()
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [magicState.status, updateSession, router, successHandled, searchParams])

  const errorParam = searchParams.get('error')
  const errorMessages: Record<string, string> = {
    invalid_token: 'Ссылка недействительна',
    expired_token: 'Ссылка устарела. Запросите новую.',
    used_token: 'Ссылка уже была использована',
    server_error: 'Ошибка сервера. Попробуйте снова.',
  }

  return (
    <div className="w-full max-w-md border border-[#f4efe5]/10 bg-[#1b1c19] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7c6ad]">
        Профиль читателя
      </p>
      <h1 className="mt-3 text-3xl font-black uppercase">Вход</h1>
      <p className="mt-3 text-sm leading-6 text-[#ded7cc]">
        Введите email — мы отправим ссылку для входа. Аккаунт создаётся автоматически.
      </p>

      {errorParam && errorMessages[errorParam] && (
        <div className="mt-5 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {errorMessages[errorParam]}
        </div>
      )}

      <div className="mt-6">
        <MagicLinkForm />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#f4efe5]/10" />
        <span className="text-xs uppercase tracking-[0.12em] text-[#ded7cc]/50">или</span>
        <div className="h-px flex-1 bg-[#f4efe5]/10" />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn('yandex', { callbackUrl: searchParams.get('redirect') || '/' })}
          className="h-11 w-full border-[#f4efe5]/10 text-sm font-bold uppercase text-[#ded7cc] hover:bg-[#f4efe5]/5"
        >
          Войти через Яндекс
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => signIn('google', { callbackUrl: searchParams.get('redirect') || '/' })}
          className="h-11 w-full border-[#f4efe5]/10 text-sm font-bold uppercase text-[#ded7cc] hover:bg-[#f4efe5]/5"
        >
          Войти через Google
        </Button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#111210] text-[#f4efe5]">
      <header className="border-b border-[#f4efe5]/10 bg-[#111210]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <Link
            href="/"
            className="text-xl font-black uppercase tracking-[0.18em] text-[#f4efe5]"
          >
            canfly
          </Link>
          <Link
            href="/characters"
            className="text-xs font-bold uppercase tracking-[0.18em] text-[#ded7cc]"
          >
            Персонажи
          </Link>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-12 md:px-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  )
}
