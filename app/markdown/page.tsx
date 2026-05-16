import Link from 'next/link';
import { MarkdownEditor } from '@/components/markdown-editor';

export const metadata = {
  title: 'canfly | культура твоего сознания',
  description: 'Погрузитесь в артхаусную вселенную с комиксами, книгами и аудиокнигами',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100 to-sky-50">
      <header className="border-b border-sky-100/80 backdrop-blur-sm sticky top-0 z-50 bg-sky-50/70">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-500"
          >
            canfly | культура твоего сознания
          </Link>

         
        </div>
      </header>

      <div className="bg-sky-50/70">
        <MarkdownEditor />
      </div>

      <footer className="border-t border-sky-100 mt-10 md:mt-20 py-8 bg-sky-50/80">
        <div className="max-w-7xl mx-auto px-4 text-center text-sky-700 text-sm">
          <p>&copy; 2005-2026 canfly | культура твоего сознания. Все права защищены.</p>
        </div>
      </footer>
    </main>
  );
}
