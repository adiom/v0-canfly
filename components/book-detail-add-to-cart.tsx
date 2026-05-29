'use client'

import { useState, useCallback } from 'react'
import { useCart } from '@/lib/cart-context'
import { Book } from '@/lib/types'

interface BookDetailAddToCartProps {
  book: Book
}

export function BookDetailAddToCart({ book }: BookDetailAddToCartProps) {
  const { addItem } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = useCallback(() => {
    addItem({
      bookId: book.id,
      title: book.title,
      price: book.price || 0,
      quantity: 1,
      image: book.cover_image,
    })

    // Visual feedback
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }, [addItem, book])

  return (
    <button
      onClick={handleAddToCart}
      className={
        isAdded
          ? 'inline-flex h-11 items-center justify-center border border-[#4a7c2a] bg-[#2d5016] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#c8e6c9]'
          : 'inline-flex h-11 items-center justify-center border border-[#f4efe5]/14 px-4 text-xs font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:border-[#f6d6a8]/45 hover:text-white'
      }
    >
      {isAdded ? '✓ Добавлено' : 'В корзину'}
    </button>
  )
}
