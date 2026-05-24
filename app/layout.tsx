import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import { YandexMetricaProvider, standardYMInitParameters } from '@artginzburg/next-ym'
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'
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
        <YandexMetricaProvider
          tagID={42420764}
          initParameters={standardYMInitParameters}
        >
          <CartProvider>
            {children}
          </CartProvider>
        </YandexMetricaProvider>
      </body>
    </html>
  )
}
