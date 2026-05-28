'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Не удалось войти')
      }

      router.push('/profile')
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

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

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-12 md:px-8">
        <form onSubmit={submit} className="w-full max-w-md border border-[#f4efe5]/10 bg-[#1b1c19] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7c6ad]">
            Профиль читателя
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase">Вход</h1>
          <p className="mt-3 text-sm leading-6 text-[#ded7cc]">
            Если логина еще нет, профиль будет создан автоматически.
          </p>

          {error ? (
            <div className="mt-5 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <label className="mt-6 block space-y-2 text-sm text-[#ded7cc]">
            <span>Логин</span>
            <Input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              required
              minLength={3}
              className="border-[#f4efe5]/10 bg-[#111210] text-[#f4efe5]"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm text-[#ded7cc]">
            <span>Пароль</span>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              type="password"
              required
              minLength={6}
              className="border-[#f4efe5]/10 bg-[#111210] text-[#f4efe5]"
            />
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 h-12 w-full bg-[#d52525] text-sm font-black uppercase text-white hover:bg-[#b91f1f]"
          >
            {loading ? 'Проверка...' : 'Войти / создать профиль'}
          </Button>
        </form>
      </section>
    </main>
  )
}
