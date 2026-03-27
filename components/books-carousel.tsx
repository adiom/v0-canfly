'use client';

import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Book } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function BooksCarousel() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch('/api/books?featured=true', {
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
          setError(null);
        } else if (data.error) {
          setError(data.error);
          setBooks([]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch books';
        console.error('Error fetching books:', error);
        setError(errorMsg);
        setBooks([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return <div className="h-96 bg-slate-900 rounded-lg flex items-center justify-center text-slate-300">Загрузка книг...</div>;
  }

  if (error || books.length === 0) {
    return (
      <div className="h-96 bg-slate-900 rounded-lg flex items-center justify-center text-slate-400">
        {error ? `Ошибка: ${error}` : 'Книги не найдены'}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent>
          {books.map((book) => (
            <CarouselItem key={book.id} className="basis-full">
              <div className="flex items-center justify-center min-h-96 bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg p-8">
                <div className="flex gap-12 items-center w-full max-w-4xl">
                  {/* Cover Image */}
                  <div className="flex-shrink-0">
                    {book.cover_image ? (
                      <Image
                        src={book.cover_image}
                        alt={book.title}
                        width={300}
                        height={450}
                        className="rounded-lg shadow-2xl object-cover"
                      />
                    ) : (
                      <div className="w-300 h-450 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                        Нет обложки
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 text-white">
                    <div className="inline-block px-3 py-1 bg-purple-900/50 text-purple-200 text-sm rounded-full mb-4 capitalize">
                      {book.type === 'comic' && 'Комикс'}
                      {book.type === 'book' && 'Книга'}
                      {book.type === 'audiobook' && 'Аудиокнига'}
                    </div>
                    
                    <h1 className="text-4xl font-bold mb-4 text-pretty">
                      {book.title}
                    </h1>
                    
                    <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                      {book.description}
                    </p>

                    <div className="flex items-center gap-6">
                      {book.price && (
                        <div className="text-3xl font-bold text-purple-300">
                          {(book.price / 100).toLocaleString('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                          })}
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Link href={`/books/${book.slug}`}>
                          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                            Читать
                          </Button>
                        </Link>
                        
                        {book.external_links && Object.keys(book.external_links).length > 0 && (
                          <div className="flex gap-2">
                            {Object.entries(book.external_links).map(([store, url]) => (
                              <a key={store} href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg">
                                  {store}
                                </Button>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 border-white/20" />
        <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 border-white/20" />
      </Carousel>

      {/* Book tabs below carousel */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.slug}`}>
            <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors text-sm font-medium">
              {book.title}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
