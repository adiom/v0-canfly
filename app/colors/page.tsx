import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import ColorsPageClient from './colors-client'

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

export const metadata: Metadata = {
  title: 'Canfly Colors | canfly',
  description:
    'Палитра литературной вселенной canfly — цвета с именами, историями и происхождением.',
  openGraph: {
    title: 'Canfly Colors | canfly',
    description:
      'Палитра литературной вселенной canfly — цвета с именами, историями и происхождением.',
    url: `${BASE_URL}/colors`,
    siteName: 'canfly',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: `${BASE_URL}/colors`,
  },
}

export default function ColorsPage() {
  return (
    <div className={cormorant.variable}>
      <ColorsPageClient />
    </div>
  )
}
