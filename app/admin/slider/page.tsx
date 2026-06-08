'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { HomepageSlide } from '@/lib/types'

export default function AdminSliderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [slides, setSlides] = useState<HomepageSlide[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const response = await fetch('/api/admin/homepage-slides')

        if (response.status === 401) {
          router.push('/admin/login')
          return
        }

        if (response.ok) {
          const data = await response.json()
          setSlides(data)
        } else {
          setError('Не удалось загрузить слайды')
        }
      } catch {
        setError('Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }

    loadSlides()
  }, [router])

  const deleteSlide = async (slide: HomepageSlide) => {
    if (!window.confirm(`Удалить слайд "${slide.title}"?`)) return

    const response = await fetch(`/api/admin/homepage-slides/${slide.id}`, { method: 'DELETE' })

    if (response.status === 401) {
      router.push('/admin/login')
      return
    }

    if (!response.ok) {
      setError('Не удалось удалить слайд')
      return
    }

    setSlides((current) => current.filter((item) => item.id !== slide.id))
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Загрузка...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Canfly
            </Link>
            <Link href="/admin" className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
              Admin
            </Link>
          </div>

          <div className="flex gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">Дашборд</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>Выход</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Hero-слайдер главной</h2>
            <p className="mt-1 text-sm text-slate-400">
              Эти слайды показываются в верхнем блоке сайта.
            </p>
          </div>
          <Link href="/admin/homepage-slides/new">
            <Button className="bg-purple-600 hover:bg-purple-700">Добавить слайд</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {slides.length > 0 ? (
            slides.map((slide) => (
              <div key={slide.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{slide.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      slide.is_active
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {slide.is_active ? 'активен' : 'скрыт'}
                    </span>
                    <span className="rounded-full bg-slate-950 px-2 py-1 text-xs text-slate-400">
                      #{slide.display_order}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-1">
                    {slide.eyebrow || slide.theme} • {slide.description || 'Описание не указано'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/homepage-slides/${slide.id}/edit`}>
                    <Button variant="outline" size="sm">Редактировать</Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteSlide(slide)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              Слайды пока не добавлены
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-slate-800 mt-20 py-8 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2024 Canfly Admin Panel</p>
        </div>
      </footer>
    </main>
  )
}