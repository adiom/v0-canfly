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

export const metadata: Metadata = {
  title: 'Canfly Colors | canfly',
  description:
    'Палитра литературной вселенной canfly — цвета с именами, историями и происхождением.',
}

export default function ColorsPage() {
  return (
    <div className={cormorant.variable}>
      <ColorsPageClient />
    </div>
  )
}
