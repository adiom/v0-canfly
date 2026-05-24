'use client';

import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderForm.customer_name || !orderForm.customer_email || items.length === 0) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          items: items.map((item) => ({
            book_id: item.bookId,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        clearCart();
        setOrderForm({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          customer_address: '',
          notes: '',
        });
      } else {
        alert('Ошибка при оформлении заказа');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
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
            <Link href="/shop" className="text-slate-300 hover:text-white transition-colors">
              Магазин
            </Link>
            <Link href="/cart" className="text-purple-400">
              Корзина
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-white mb-12">Корзина</h1>

        {submitted ? (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-2">Спасибо за заказ!</h2>
            <p className="text-slate-300 mb-6">
              Мы получили вашу заявку. Вскоре с вами свяжется наша команда для подтверждения.
            </p>
            <Link href="/shop">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Вернуться в магазин
              </Button>
            </Link>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {items.length > 0 ? (
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.bookId} className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex gap-6">
                    {/* Image */}
                    {item.image ? (
                      <div className="flex-shrink-0 relative w-24 h-32">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-24 h-32 bg-slate-700 rounded flex items-center justify-center text-slate-400 text-xs">
                        Нет фото
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-purple-300 font-semibold mb-4">
                        {(item.price / 100).toLocaleString('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                        })}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm"
                        >
                          −
                        </button>
                        <span className="text-white font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.bookId)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : !submitted ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center mb-8">
                <p className="text-slate-400 mb-6">Ваша корзина пуста</p>
                <Link href="/shop">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Перейти в магазин
                  </Button>
                </Link>
              </div>
            ) : null}

            {/* Order Form */}
            {items.length > 0 && !submitted && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Информация для заказа</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Имя *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={orderForm.customer_name}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="Ваше имя"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      value={orderForm.customer_email}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={orderForm.customer_phone}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="+7 (999) 999-99-99"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Адрес доставки
                    </label>
                    <input
                      type="text"
                      name="customer_address"
                      value={orderForm.customer_address}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="Ваш адрес"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Дополнительные заметки
                    </label>
                    <textarea
                      name="notes"
                      value={orderForm.notes}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
                      rows={3}
                      placeholder="Дополнительная информация..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? 'Обработка...' : 'Оформить заказ'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearCart}
                    >
                      Очистить корзину
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-20">
                <h2 className="text-xl font-bold text-white mb-6">Итого</h2>
                
                <div className="space-y-3 mb-6 pb-6 border-b border-slate-700">
                  {items.map((item) => (
                    <div key={item.bookId} className="flex justify-between text-slate-300 text-sm">
                      <span>{item.title} × {item.quantity}</span>
                      <span>
                        {((item.price * item.quantity) / 100).toLocaleString('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-2xl font-bold text-white">
                  {(total / 100).toLocaleString('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
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
