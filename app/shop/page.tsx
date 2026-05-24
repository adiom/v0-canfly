'use client';

import { useEffect, useState } from 'react';
import { Book } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import Image from 'next/image';

export default function ShopPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch('/api/books', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        
        const data = await res.json();
        if (Array.isArray(data)) {
          setBooks(data);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleAddToCart = (book: Book) => {
    if (!book.price) return;
    
    addItem({
      bookId: book.id,
      title: book.title,
      price: book.price,
      quantity: 1,
      image: book.cover_image,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Canfly
          </Link>
          
          <nav className="flex gap-6 items-center">
            <Link href="/characters" className="text-slate-300 hover:text-white transition-colors">
              Персонажи
            </Link>
            <Link href="/shop" className="text-purple-400">
              Магазин
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">Корзина</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Магазин</h1>
          <p className="text-xl text-slate-300">Приобретите книги, комиксы и аудиокниги вселенной Canfly</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Загрузка товаров...</div>
        ) : books.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div key={book.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-purple-500 transition-colors group">
                {/* Cover */}
                {book.cover_image ? (
                  <div className="relative w-full h-72 overflow-hidden bg-slate-900">
                    <Image
                      src={book.cover_image}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-full h-72 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-slate-400">
                    Нет обложки
                  </div>
                )}

                {/* Info */}
                <div className="p-6">
                  <div className="inline-block px-2 py-1 bg-purple-900/50 text-purple-200 text-xs rounded-full mb-3 capitalize">
                    {book.type === 'comic' && 'Комикс'}
                    {book.type === 'book' && 'Книга'}
                    {book.type === 'audiobook' && 'Аудиокнига'}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {book.description}
                  </p>

                  <div className="flex items-end justify-between">
                    {book.price ? (
                      <div className="text-2xl font-bold text-purple-300">
                        {(book.price / 100).toLocaleString('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                        })}
                      </div>
                    ) : (
                      <div className="text-slate-400">Цена не указана</div>
                    )}
                    
                    {book.price && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleAddToCart(book)}
                      >
                        В корзину
                      </Button>
                    )}
                  </div>

                  {/* External Links */}
                  {book.external_links && Object.keys(book.external_links).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
                      {Object.entries(book.external_links).map(([store, url]) => (
                        <a
                          key={store}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                        >
                          {store}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Товары не найдены
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
         <p>2026 &copy; Canfly</p>
        </div>
      </footer>
    </main>
  );
}
