/**
 * SEO Schema Generator
 * Создаёт структурированные данные для Google, Яндекса и соцсетей
 */

import { BookWithCharacters, Character } from '@/lib/types'

export type SchemaType =
  | ReturnType<typeof generateBookSchema>
  | ReturnType<typeof generateCharacterSchema>
  | ReturnType<typeof generateOrganizationSchema>

/**
 * Schema для Book/CreativeWork
 * Используется для: Google Books, Яндекс, соцсети
 */
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
    image: book.cover_image,
    url: bookUrl,
    datePublished: book.created_at ? new Date(book.created_at).toISOString().split('T')[0] : undefined,
    dateModified: book.updated_at ? new Date(book.updated_at).toISOString().split('T')[0] : undefined,
    author: {
      '@type': 'Person',
      name: 'Адиом Тимур',
      url: `${baseUrl}/`,
      sameAs: [
        'https://twitter.com/adiomtimur',
        'https://github.com/adiom',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'canfly | культура твоего сознания',
      url: baseUrl,
    },
    genre: [
      getGenreLabel(book.type),
      'Contemporary Fiction',
      'Literature',
    ],
    // Для Google Books
    bookEdition: book.type === 'comic' ? 'Comic Edition' : 'Digital Edition',
    inLanguage: 'ru-RU',
    // Цена и предложение
    ...(book.price && {
      offers: {
        '@type': 'Offer',
        url: bookUrl,
        priceCurrency: 'RUB',
        price: (book.price / 100).toString(),
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'canfly Shop',
        },
      },
    }),
    // Персонажи
    ...(book.characters && book.characters.length > 0 && {
      character: book.characters.map((char) => ({
        '@type': 'Person',
        name: char.name,
        url: `${baseUrl}/characters/${char.slug}`,
        image: char.avatar,
      })),
    }),
    // Рейтинг (если есть)
    // aggregateRating: {
    //   '@type': 'AggregateRating',
    //   ratingValue: '4.5',
    //   ratingCount: '89',
    // },
  }
}

/**
 * Schema для Character/Person
 */
export function generateCharacterSchema(
  character: Character,
  baseUrl: string
) {
  const characterUrl = `${baseUrl}/characters/${character.slug}`
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': characterUrl,
    name: character.name,
    description: character.bio,
    url: characterUrl,
    image: character.avatar,
    // Полное описание как расширенное поле
    ...(character.full_description && {
      disambiguatingDescription: character.full_description.substring(0, 500),
    }),
    // Способности как skills/knowsAbout
    ...(character.abilities && character.abilities.length > 0 && {
      knowsAbout: character.abilities,
    }),
    // Издатель (принадлежит вселенной)
    publisher: {
      '@type': 'Organization',
      name: 'canfly',
      url: baseUrl,
    },
    // Язык
    inLanguage: 'ru-RU',
  }
}

/**
 * Schema для организации (сайт целиком)
 */
export function generateOrganizationSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': baseUrl,
    name: 'canfly | культура твоего сознания',
    description:
      'Литературная вселенная о тревоге, ремесле, памяти, цифровой усталости и людях',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://twitter.com/adiomtimur',
      'https://github.com/adiom',
    ],
    founder: {
      '@type': 'Person',
      name: 'Адиом Тимур',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+7-XXX-XXX-XX-XX',
      contactType: 'Customer Support',
      email: 'contact@canfly.org',
    },
  }
}

/**
 * Schema для BreadcrumbList (навигация)
 */
export function generateBreadcrumbSchema(
  items: Array<{ label: string; url: string }>,
  baseUrl: string
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

/**
 * Schema для Список книг
 */
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

/**
 * Open Graph теги для соцсетей
 */
export function generateOpenGraphTags(
  title: string,
  description: string,
  image: string | null,
  url: string,
  type: 'website' | 'article' | 'book' | 'profile' = 'website'
) {
  return {
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:type': type,
    'og:image': image || '/og-image.png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:locale': 'ru_RU',
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image || '/og-image.png',
    'twitter:creator': '@adiom',
  }
}

/**
 * Вспомогательные функции
 */

function getGenreLabel(type: string): string {
  const genres: Record<string, string> = {
    book: 'Novel',
    comic: 'Comics',
    audiobook: 'AudioBook',
  }
  return genres[type] || 'Book'
}

/**
 * Валидация URL для schema.org
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Помощник для вставки схемы в <head>
 */
export function schemaToString(schema: SchemaType): string {
  return JSON.stringify(schema)
}
