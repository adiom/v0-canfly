import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import { YandexMetrika } from '@/components/yandex-metrika'
import Script from 'next/script'
import { Suspense } from 'react'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'canfly | культура твоего сознания',
  description: 'Артхаусное издательство с комиксами, книгами и аудиокнигами. Встреться с персонажами и поговори с ними через AI.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <CartProvider>
          {children}
        </CartProvider>
        <Analytics />
        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          src="https://mc.yandex.ru/metrika/tag.js"
        />
        <Script
          id="yandex-metrika-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.ym = window.ym || function(){(window.ym.a = window.ym.a || []).push(arguments)};
              window.ym.l = 1*new Date();
              ym(42420764, 'init', {
                defer: true,
                webvisor: true,
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                trackHash: true
              });
            `
          }}
        />
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/42420764" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  )
}
