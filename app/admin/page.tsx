'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Book, Order, Character } from '@/lib/types';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<'books' | 'characters' | 'orders'>('books');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [booksRes, ordersRes, charsRes] = await Promise.all([
          fetch('/api/admin/books'),
          fetch('/api/admin/orders'),
          fetch('/api/admin/characters'),
        ]);

        if (booksRes.status === 401 || charsRes.status === 401 || ordersRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (booksRes.ok) {
          const data = await booksRes.json();
          setBooks(data);
        } else {
          setError('Не удалось загрузить книги');
        }

        if (charsRes.ok) {
          const data = await charsRes.json();
          setCharacters(data);
        } else {
          setError('Не удалось загрузить персонажей');
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data);
        } else {
          setError('Не удалось загрузить заказы');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Ошибка загрузки админки');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const deleteBook = async (book: Book) => {
    if (!window.confirm(`Удалить книгу "${book.title}"?`)) return;

    const response = await fetch(`/api/admin/books/${book.id}`, { method: 'DELETE' });

    if (response.status === 401) {
      router.push('/admin/login');
      return;
    }

    if (!response.ok) {
      setError('Не удалось удалить книгу');
      return;
    }

    setBooks((current) => current.filter((item) => item.id !== book.id));
  };

  const deleteCharacter = async (character: Character) => {
    if (!window.confirm(`Удалить персонажа "${character.name}"?`)) return;

    const response = await fetch(`/api/admin/characters/${character.id}`, { method: 'DELETE' });

    if (response.status === 401) {
      router.push('/admin/login');
      return;
    }

    if (!response.ok) {
      setError('Не удалось удалить персонажа');
      return;
    }

    setCharacters((current) => current.filter((item) => item.id !== character.id));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Загрузка...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            CanFly Admin
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Выход
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-8 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'books'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Книги ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'characters'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Персонажи ({characters.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Заказы ({orders.length})
          </button>
        </div>

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Управление книгами</h2>
              <Link href="/admin/books/new">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Добавить книгу
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {books.map((book) => (
                <div key={book.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{book.title}</h3>
                    <p className="text-slate-400 text-sm">
                      {book.type} • {book.price ? `₽${(book.price / 100).toFixed(2)}` : 'Цена не указана'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/books/${book.id}/edit`}>
                      <Button variant="outline" size="sm">Редактировать</Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteBook(book)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Управление персонажами</h2>
              <Link href="/admin/characters/new">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Добавить персонажа
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {characters.map((char) => (
                <div key={char.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{char.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-1">{char.bio}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/characters/${char.id}/edit`}>
                      <Button variant="outline" size="sm">Редактировать</Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteCharacter(char)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Заказы</h2>

            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                        <p className="text-slate-400 text-sm">{order.customer_email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'completed' ? 'bg-green-900/50 text-green-200' :
                        order.status === 'confirmed' ? 'bg-blue-900/50 text-blue-200' :
                        order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-200' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-700">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-300">
                          {item.title} × {item.quantity}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold text-purple-300">
                        ₽{(order.total / 100).toFixed(2)}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Заказов не найдено
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2024 CanFly Admin Panel</p>
        </div>
      </footer>
    </main>
  );
}
