import type { Metadata } from 'next'

import { fetchReleasesWithEditions } from '@/lib/server/releases'
import { ReleasesPageBookmate } from '@/components/releases-page-bookmate'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://canfly.org'

export const metadata: Metadata = {
  title: 'Релизы | canfly — литературная вселенная',
  description:
    'Каталог всех релизов вселенной canfly: комиксы, книги, аудиокниги и многое другое.',
  openGraph: {
    title: 'Релизы | canfly — литературная вселенная',
    description:
      'Каталог всех релизов вселенной canfly: комиксы, книги, аудиокниги и многое другое.',
    url: `${BASE_URL}/releases`,
    siteName: 'canfly',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: `${BASE_URL}/releases`,
  },
}

export default async function ReleasesPage() {
  const releases = await fetchReleasesWithEditions({ status: 'published' })

  return <ReleasesPageBookmate releases={releases} />
}
