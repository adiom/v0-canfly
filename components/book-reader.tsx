'use client'

import { useState } from 'react'
import { BookWithCharacters } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { MarkdownRenderer } from '@/components/markdown-renderer'

export function BookReader({ book }: { book: BookWithCharacters }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)
  const { addItem } = useCart()

  const pages = book.preview_pages || []
  const chapters = book.chapters || []
  const isComicMode = book.type === 'comic' && pages.length > 0
  const isBookMode = book.type === 'book' && chapters.length > 0

  const handleAddToCart = () => {
    if (!book.price) return
    addItem({
      bookId: book.id,
      title: book.title,
      price: book.price,
      quantity: 1,
      image: book.cover_image,
    })
  }

  return (
    <main className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${fullscreen ? 'flex flex-col' : ''}`}>
      {/* Header */}
      {!fullscreen && (
        <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Canfly
            </Link>
            <div className="flex gap-4 items-center">
              <Link href="/shop" className="text-slate-300 hover:text-white transition-colors">
                ← Назад
              </Link>
              <Link href="/cart">
                <Button variant="outline" size="sm">Корзина</Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <section className={`flex-1 flex ${fullscreen ? 'flex-col' : ''}`}>
        {!fullscreen ? (
          <div className="max-w-7xl mx-auto px-4 py-12 w-full">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Book Info */}
              <div className="md:col-span-1">
                {book.cover_image && (
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-2xl mb-6">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h1 className="text-2xl font-bold text-white mb-4">{book.title}</h1>

                <div className="inline-block px-3 py-1 bg-purple-900/50 text-purple-200 text-sm rounded-full mb-4 capitalize">
                  {book.type === 'comic' && 'Комикс'}
                  {book.type === 'book' && 'Книга'}
                  {book.type === 'audiobook' && 'Аудиокнига'}
                </div>

                {book.price && (
                  <div className="text-3xl font-bold text-purple-300 mb-6">
                    {(book.price / 100).toLocaleString('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                    })}
                  </div>
                )}

                <Button
                  onClick={handleAddToCart}
                  disabled={!book.price}
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
                >
                  Добавить в корзину
                </Button>

                {book.external_links && Object.keys(book.external_links).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm font-medium">Купить в других магазинах:</p>
                    {Object.entries(book.external_links).map(([store, url]) => (
                      <a
                        key={store}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-center transition-colors text-sm"
                      >
                        {store}
                      </a>
                    ))}
                  </div>
                )}

                {book.characters && book.characters.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm font-medium text-slate-400">Персонажи:</p>
                    {book.characters.map((character) => (
                      <Link
                        key={character.id}
                        href={`/characters/${character.slug}`}
                        className="block rounded bg-slate-800 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        {character.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Reader */}
              <div className="md:col-span-3">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Читать онлайн</h2>
                    {isComicMode && (
                      <Button
                        onClick={() => setFullscreen(true)}
                        variant="outline"
                        size="sm"
                      >
                        На весь экран
                      </Button>
                    )}
                  </div>

                  {/* Режим комикса — картинки */}
                  {isComicMode && (
                    <div>
                      <div className="bg-black rounded-lg mb-6 flex items-center justify-center min-h-96">
                        {pages[currentPage] ? (
                          <img
                            src={pages[currentPage]}
                            alt={`Страница ${currentPage + 1}`}
                            className="max-w-full max-h-96 rounded"
                          />
                        ) : (
                          <p className="text-slate-400">Страница не найдена</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors"
                        >
                          ← Назад
                        </button>
                        <div className="text-slate-300 text-sm">
                          Страница {currentPage + 1} из {pages.length}
                        </div>
                        <button
                          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                          disabled={currentPage === pages.length - 1}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors"
                        >
                          Вперед →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Режим книги — главы с markdown */}
                  {isBookMode && (
                    <div className="grid md:grid-cols-4 gap-6">
                      {/* Оглавление */}
                      <nav className="md:col-span-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.18em] mb-3">
                          Оглавление
                        </p>
                        <ul className="space-y-1">
                          {chapters.map((ch, i) => (
                            <li key={i}>
                              <button
                                onClick={() => setCurrentChapter(i)}
                                className={[
                                  'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                                  i === currentChapter
                                    ? 'bg-purple-900/50 text-purple-200 font-medium'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700',
                                ].join(' ')}
                              >
                                <span className="text-xs text-slate-500 mr-1">{i + 1}.</span>
                                {ch.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </nav>

                      {/* Содержимое главы */}
                      <div className="md:col-span-3">
                        <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-slate-700">
                          {chapters[currentChapter]?.title}
                        </h3>

                        <MarkdownRenderer
                          content={chapters[currentChapter]?.content}
                          className="mb-8"
                        />

                        {/* Навигация по главам */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                          <button
                            onClick={() => setCurrentChapter((prev) => Math.max(0, prev - 1))}
                            disabled={currentChapter === 0}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors text-sm"
                          >
                            ← Предыдущая
                          </button>
                          <span className="text-slate-400 text-sm">
                            Глава {currentChapter + 1} из {chapters.length}
                          </span>
                          <button
                            onClick={() => setCurrentChapter((prev) => Math.min(chapters.length - 1, prev + 1))}
                            disabled={currentChapter === chapters.length - 1}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors text-sm"
                          >
                            Следующая →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Заглушка — нет контента */}
                  {!isComicMode && !isBookMode && (
                    <div className="text-center py-12">
                      <p className="text-slate-400 mb-6">Содержимое недоступно для чтения онлайн</p>
                      <p className="text-slate-500 text-sm mb-6">{book.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Fullscreen Reader (только для комиксов)
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex justify-between items-center p-4 bg-slate-900/80 backdrop-blur border-b border-slate-700">
              <h2 className="text-white font-bold">{book.title}</h2>
              <button
                onClick={() => setFullscreen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Выход
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
              {pages[currentPage] ? (
                <img
                  src={pages[currentPage]}
                  alt={`Страница ${currentPage + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-slate-400">Страница не найдена</p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur border-t border-slate-700">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors"
              >
                ← Назад
              </button>
              <div className="text-slate-300 text-sm">
                {currentPage + 1} / {pages.length}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors"
              >
                Вперед →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      {!fullscreen && (
        <footer className="border-t border-slate-800 py-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p>&copy; 2024 Canfly. Все права защищены.</p>
          </div>
        </footer>
      )}
    </main>
  )
}
