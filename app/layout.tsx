import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { CartProvider } from '@/lib/cart-context'
import {YandexMetrika} from "@/components/yandex-metrika";
import { generateOrganizationSchema } from '@/lib/seo/schema'
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.ru'
const organizationSchema = generateOrganizationSchema(BASE_URL)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <CartProvider>
          {children}
        </CartProvider>
        <Script id="yandex-metrika" strategy="lazyOnload">
          {`
            (function(m, e, t, r, i, k, a) {
              m[i] = m[i] || function() {
                (m[i].a = m[i].a || []).push(arguments)
              };
              m[i].l = 1 * new Date();
              k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
            })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

            ym(42420764, 'init', {
              webvisor: true,
              clickmap: true,
              referrer: document.referrer,
              url: location.href,
              accurateTrackBounce: true,
              trackLinks: true
            });
          `}
        </Script>
        
      </body>
      
    </html>
  )
}
