'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { BookWithCharacters, BookType } from '@/lib/types'
import { useCart } from '@/lib/cart-context'

interface BooksClientProps {
  books: BookWithCharacters[]
}

function typeLabel(type: BookType): string {
  switch (type) {
    case 'comic':
      return 'Комикс'
    case 'audiobook':
      return 'Аудиокнига'
    default:
      return 'Книга'
  }
}

function formatPrice(kopeks: number): string {
  return (kopeks / 100).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  })
}

export function BooksClient({ books }: BooksClientProps) {
  const { addItem } = useCart()
  const [addedBookId, setAddedBookId] = useState<string | null>(null)

  const handleAddToCart = useCallback(
    (book: BookWithCharacters) => {
      addItem({
        bookId: book.id,
        title: book.title,
        price: book.price || 0,
        quantity: 1,
        image: book.cover_image,
      })

      // Visual feedback
      setAddedBookId(book.id)
      setTimeout(() => setAddedBookId(null), 2000)
    },
    [addItem]
  )

  if (books.length === 0) {
    return (
      <div className="rounded-sm border border-[#f4efe5]/10 bg-[#1b1c19] p-12 text-center">
        <p className="text-[#c9c1b4]">Пока нет опубликованных книг в базе.</p>
        <p className="mt-3 text-sm text-[#8f877c]">Добавьте издания в админке или проверьте схему Postgres.</p>
        <Link
          href="/admin"
          className="mt-8 inline-flex h-12 items-center bg-[#d52525] px-5 text-sm font-black uppercase text-white hover:bg-[#b01e1e]"
        >
          Админка
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <article
          key={book.id}
          className="group flex flex-col border border-[#f4efe5]/10 bg-[#1b1c19] transition-colors hover:border-[#f6d6a8]/35"
        >
          <Link href={`/books/${book.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-[#0c0d0c]">
            {book.cover_image ? (
              <Image
                src={book.cover_image}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-xs uppercase tracking-[0.18em] text-[#8f877c]">
                Нет обложки
              </div>
            )}
            {book.is_featured ? (
              <span className="absolute left-3 top-3 bg-[#d52525] px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                Избранное
              </span>
            ) : null}
          </Link>

          <div className="flex flex-1 flex-col p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9db5c8]">
                {typeLabel(book.type)}
              </span>
              {book.price ? <span className="text-xs text-[#8f877c]">{formatPrice(book.price)}</span> : null}
            </div>

            <h3 className="text-xl font-black uppercase leading-tight text-[#fff8ea]">
              <Link href={`/books/${book.slug}`} className="hover:text-[#f6d6a8]">
                {book.title}
              </Link>
            </h3>

            {book.description ? (
              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-[#c9c1b4]">{book.description}</p>
            ) : null}

            {book.characters && book.characters.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f4efe5]/10 pt-4">
                {book.characters.slice(0, 4).map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/characters/${ch.slug}`}
                    className="inline-flex items-center gap-2 rounded-sm border border-[#f4efe5]/10 px-2 py-1 text-xs text-[#ded7cc] transition-colors hover:border-[#9db5c8]/45 hover:text-white"
                  >
                    {ch.avatar ? (
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#111210]">
                        <Image src={ch.avatar} alt="" fill className="object-cover" sizes="24px" />
                      </span>
                    ) : null}
                    <span className="truncate font-medium">{ch.name}</span>
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/books/${book.slug}`}
                className="inline-flex h-11 flex-1 items-center justify-center bg-[#d52525] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#b01e1e] sm:flex-none"
              >
                Читать фрагмент
              </Link>
              <button
                onClick={() => handleAddToCart(book)}
                className={
                  addedBookId === book.id
                    ? 'inline-flex h-11 items-center justify-center border border-[#4a7c2a] bg-[#2d5016] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#c8e6c9]'
                    : 'inline-flex h-11 items-center justify-center border border-[#f4efe5]/14 px-4 text-xs font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:border-[#f6d6a8]/45 hover:text-white'
                }
              >
                {addedBookId === book.id ? '✓ Добавлено' : 'В корзину'}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
