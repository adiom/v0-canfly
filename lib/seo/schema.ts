import { BookWithCharacters } from '@/lib/types'
import type { Release, EditionFormat } from '@/lib/releases-types'

export type SchemaType =
  | ReturnType<typeof generateReleaseSchema>
  | ReturnType<typeof generateOrganizationSchema>

const CANFLY_AUTHOR = {
  '@type': 'Person',
  name: 'Адиом Тимур',
  url: 'https://canfly.org/',
  sameAs: ['https://twitter.com/adiomtimur', 'https://github.com/adiom'],
}

function schemaOrgType(formats: EditionFormat[]): string {
  if (formats.includes('audiobook') || formats.includes('audiorelease')) return 'AudioBook'
  if (formats.includes('comic')) return 'Book'
  return 'Book'
}

function bookGenres(formats: EditionFormat[], genre: string | null): string[] {
  const g: string[] = ['Fiction', 'Contemporary Fiction']
  if (formats.includes('comic')) g.push('Comics & Graphic Novels')
  if (genre && !g.includes(genre)) g.push(genre)
  return g
}

export function generateReleaseSchema(
  release: Release,
  formats: EditionFormat[],
  baseUrl: string,
  characters?: Array<{ name: string; slug: string; avatar: string | null }>
) {
  const url = `${baseUrl}/release/${release.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': schemaOrgType(formats),
    '@id': url,
    name: release.title,
    description: release.annotation ?? release.description ?? `«${release.title}» на canfly`,
    image: release.cover_image
      ? { '@type': 'ImageObject', url: release.cover_image }
      : undefined,
    url,
    datePublished: release.release_date ?? new Date(release.created_at).toISOString().split('T')[0],
    dateModified: new Date(release.updated_at).toISOString().split('T')[0],
    author: CANFLY_AUTHOR,
    publisher: {
      '@type': 'Organization',
      name: 'canfly',
      url: baseUrl,
    },
    genre: bookGenres(formats, release.genre),
    inLanguage: 'ru-RU',
    ...(release.isbn && { isbn: release.isbn }),
    ...(characters && characters.length > 0 && {
      character: characters.map((char) => ({
        '@type': 'Person',
        name: char.name,
        url: `${baseUrl}/characters/${char.slug}`,
        ...(char.avatar && { image: { '@type': 'ImageObject', url: char.avatar } }),
      })),
    }),
  }
}

export function generateOrganizationSchema(baseUrl: string) {
  const id = `${baseUrl}/#organization`

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': id,
    name: 'canfly',
    description:
      'canfly — литературная вселенная о тревоге, ремесле, памяти, цифровой усталости и людях, которые продолжают функционировать.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
    },
    sameAs: ['https://twitter.com/adiomtimur', 'https://github.com/adiom'],
    founder: { '@type': 'Person', name: 'Адиом Тимур' },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+7-999-512-2887',
      contactType: 'Customer Support',
      email: 'support@canfly.org',
    },
  }
}

export function generateBreadcrumbSchema(
  items: Array<{ label: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.url,
    })),
  }
}

export function generateNewsArticleSchema(
  post: { id: string; title: string; content: string | null; section: string; created_at: string },
  baseUrl: string
) {
  const url = `${baseUrl}/news/${post.id}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: post.title,
    description: post.content?.slice(0, 160) ?? post.title,
    datePublished: new Date(post.created_at).toISOString().split('T')[0],
    author: CANFLY_AUTHOR,
    publisher: {
      '@type': 'Organization',
      name: 'canfly',
      url: baseUrl,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'ru-RU',
    articleSection: post.section,
  }
}

export function generateCharacterSchema(
  character: { name: string; slug: string; avatar: string | null; bio: string | null },
  baseUrl: string
) {
  const url = `${baseUrl}/characters/${character.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': url,
    name: character.name,
    description: character.bio
      ? `${character.bio} — персонаж литературной вселенной canfly.`
      : `Персонаж литературной вселенной canfly.`,
    image: character.avatar
      ? { '@type': 'ImageObject', url: character.avatar }
      : undefined,
    url,
  }
}

/** @deprecated Books system retired. Used only by old books pages (museum). */
export function generateBookSchema(
  book: BookWithCharacters,
  baseUrl: string
) {
  const bookUrl = `${baseUrl}/books/${book.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': book.type === 'audiobook' ? 'AudioBook' : 'Book',
    '@id': bookUrl,
    name: book.title,
    description: book.description,
    image: book.cover_image
      ? { '@type': 'ImageObject', url: book.cover_image }
      : undefined,
    url: bookUrl,
    datePublished: book.created_at ? new Date(book.created_at).toISOString().split('T')[0] : undefined,
    dateModified: book.updated_at ? new Date(book.updated_at).toISOString().split('T')[0] : undefined,
    author: CANFLY_AUTHOR,
    publisher: { '@type': 'Organization', name: 'canfly', url: baseUrl },
    genre: ['Fiction', 'Contemporary Fiction'],
    inLanguage: 'ru-RU',
    ...(book.price && {
      offers: {
        '@type': 'Offer',
        url: bookUrl,
        priceCurrency: 'RUB',
        price: (book.price / 100).toString(),
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'canfly' },
      },
    }),
    ...(book.characters && book.characters.length > 0 && {
      character: book.characters.map((char) => ({
        '@type': 'Person',
        name: char.name,
        url: `${baseUrl}/characters/${char.slug}`,
        image: char.avatar
          ? { '@type': 'ImageObject', url: char.avatar }
          : undefined,
      })),
    }),
  }
}

/** @deprecated Books system retired. Used only by old books pages (museum). */
export function generateBooksCollectionSchema(
  books: BookWithCharacters[],
  baseUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Canfly Books',
    url: `${baseUrl}/books`,
    itemListElement: books.map((book, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: generateBookSchema(book, baseUrl),
    })),
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
