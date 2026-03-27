import { BooksCarousel } from '@/components/books-carousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'canfly | культура твоего сознания',
  description: 'Погрузитесь в артхаусную вселенную с комиксами, книгами и аудиокнигами',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            canfly
          </Link>
          
          <nav className="flex gap-6 items-center">
            <Link href="/characters" className="text-slate-300 hover:text-white transition-colors">
              Персонажи
            </Link>
            <Link href="/shop" className="text-slate-300 hover:text-white transition-colors">
              Магазин
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">Корзина</Button>
            </Link>
            <Link href="/admin" className="text-slate-400 hover:text-slate-300 transition-colors text-sm">
              Администраторам
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-balance">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">canfly</span>
          </h1>
          <p className="text-xl text-slate-300 text-balance mb-2">
            культура твоего сознания
          </p>
          <p className="text-lg text-slate-400 text-balance">
            Артхаусная вселенная героев, магии и восстания против времени
          </p>
        </div>

        {/* Carousel */}
        <div className="mb-16">
          <BooksCarousel />
        </div>

        {/* CTA Section */}
        <section className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-3">Комиксы</h3>
            <p className="text-slate-300 mb-6">Визуальные эпосы с потрясающим искусством и глубокими историями</p>
            <Link href="/characters">
              <Button variant="outline" className="w-full">Исследовать</Button>
            </Link>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-3">Книги</h3>
            <p className="text-slate-300 mb-6">Погружённые в мир романы, дополняющие вселенную CanFly</p>
            <Link href="/shop">
              <Button variant="outline" className="w-full">Купить</Button>
            </Link>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-3">Персонажи</h3>
            <p className="text-slate-300 mb-6">Встретьте героев вселенной и откройте их связи</p>
            <Link href="/characters">
              <Button variant="outline" className="w-full">Узнать больше</Button>
            </Link>
          </div>
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2024 canfly | культура твоего сознания. Все права защищены.</p>
        </div>
      </footer>
    </main>
  );
}
