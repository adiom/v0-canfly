'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';

const navItems = [
  { label: 'Новости', href: '/news' },
  { label: 'Книги', href: '/books' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Магазин', href: '/shop' },
]

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
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <header className="sticky top-0 z-50 border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex h-14 items-center gap-3" aria-label="Canfly home">
            <span className="flex h-9 w-16 items-center justify-center bg-cf-accent text-lg font-black uppercase tracking-[-0.04em] text-white">
              canfly
            </span>
          </Link>

          <nav className="hidden h-14 items-center lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-full items-center border-x border-transparent px-3 text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 transition-colors hover:border-cf-text-1/10 hover:bg-cf-text-1/6 hover:text-cf-text-heading lg:px-4"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/cart"
              className="flex h-full items-center border-x border-cf-text-1/10 bg-cf-text-1/8 px-3 text-xs font-black uppercase tracking-[0.12em] text-cf-text-heading lg:px-4"
            >
              Корзина
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileNav items={[...navItems, { label: 'Корзина', href: '/cart' }]} />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="mb-12">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">оформление</p>
          <h1 className="text-4xl font-black uppercase leading-none text-cf-text-heading md:text-5xl">Корзина</h1>
        </div>

        {submitted ? (
          <div className="border border-cf-text-1/10 bg-cf-bg-2 p-8 text-center mb-12">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cf-accent">готово</p>
            <h2 className="text-2xl font-black uppercase text-cf-text-heading mb-3">Спасибо за заказ!</h2>
            <p className="text-cf-text-caption mb-6">
              Мы получили вашу заявку. Вскоре с вами свяжется наша команда для подтверждения.
            </p>
            <Link
              href="/shop"
              className="inline-flex h-12 items-center bg-cf-accent px-6 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-[#b01e1e]"
            >
              Вернуться в магазин
            </Link>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {items.length > 0 ? (
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.bookId} className="border border-cf-text-1/10 bg-cf-bg-2 p-6 flex gap-6">
                    {item.image ? (
                      <div className="flex-shrink-0 relative w-24 h-32">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-24 h-32 bg-cf-bg flex items-center justify-center text-cf-text-4 text-xs">
                        Нет фото
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="text-lg font-black uppercase text-cf-text-heading mb-2">{item.title}</h3>
                      <p className="text-cf-warm font-black mb-4">
                        {(item.price / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          className="border border-cf-text-1/14 text-cf-text-1 px-3 py-1 text-sm hover:bg-cf-text-1/8 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-cf-text-heading font-black w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                          className="border border-cf-text-1/14 text-cf-text-1 px-3 py-1 text-sm hover:bg-cf-text-1/8 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.bookId)}
                      className="text-cf-text-4 hover:text-cf-accent transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : !submitted ? (
              <div className="border border-cf-text-1/10 bg-cf-bg-2 p-12 text-center mb-8">
                <p className="text-cf-text-3 mb-6">Ваша корзина пуста</p>
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center bg-cf-accent px-6 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-[#b01e1e]"
                >
                  Перейти в магазин
                </Link>
              </div>
            ) : null}

            {items.length > 0 && !submitted && (
              <div className="border border-cf-text-1/10 bg-cf-bg-2 p-8">
                <h2 className="text-2xl font-black uppercase text-cf-text-heading mb-6">Информация для заказа</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { label: 'Имя *', name: 'customer_name', type: 'text', placeholder: 'Ваше имя', required: true },
                    { label: 'Email *', name: 'customer_email', type: 'email', placeholder: 'your@email.com', required: true },
                    { label: 'Телефон', name: 'customer_phone', type: 'tel', placeholder: '+7 (999) 999-99-99', required: false },
                    { label: 'Адрес доставки', name: 'customer_address', type: 'text', placeholder: 'Ваш адрес', required: false },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-cf-text-2 text-xs font-black uppercase tracking-[0.12em] mb-2">{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={orderForm[field.name as keyof typeof orderForm]}
                        onChange={handleInputChange}
                        className="w-full border border-cf-text-1/14 bg-cf-bg px-4 py-2.5 text-cf-text-1 placeholder-cf-text-4 focus:outline-none focus:border-cf-accent/60"
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-cf-text-2 text-xs font-black uppercase tracking-[0.12em] mb-2">Дополнительные заметки</label>
                    <textarea
                      name="notes"
                      value={orderForm.notes}
                      onChange={handleInputChange}
                      className="w-full border border-cf-text-1/14 bg-cf-bg px-4 py-2.5 text-cf-text-1 placeholder-cf-text-4 focus:outline-none focus:border-cf-accent/60 resize-none"
                      rows={3}
                      placeholder="Дополнительная информация..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 bg-cf-accent text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-[#b01e1e] disabled:opacity-50"
                    >
                      {loading ? 'Обработка...' : 'Оформить заказ'}
                    </button>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="h-12 px-5 border border-cf-text-1/14 text-xs font-black uppercase tracking-[0.12em] text-cf-text-2 hover:bg-cf-text-1/8 transition-colors"
                    >
                      Очистить
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="lg:col-span-1">
              <div className="border border-cf-text-1/10 bg-cf-bg-2 p-6 sticky top-20">
                <h2 className="text-xl font-black uppercase text-cf-text-heading mb-6">Итого</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-cf-text-1/10">
                  {items.map((item) => (
                    <div key={item.bookId} className="flex justify-between text-cf-text-caption text-sm">
                      <span>{item.title} × {item.quantity}</span>
                      <span>
                        {((item.price * item.quantity) / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-2xl font-black text-cf-text-heading">
                  {(total / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-cf-text-1/10 bg-cf-footer-bg mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-cf-text-4 text-sm">
          <p>© 2005-2026 canfly. Литературная вселенная Адиома Тимура.</p>
        </div>
      </footer>
    </main>
  );
}
