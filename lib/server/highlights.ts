import type { Highlight, ChapterRating, BookReview } from '@/lib/types'

// Старые функции — возвращают пустые массивы, чтобы устаревший BookReader не падал.
// Новая система — см. lib/server/chapter-highlights.ts

export async function fetchHighlights(_options: {
  bookId?: string;
  userId?: string;
  type?: string;
  visibility?: string;
  includeInternal?: boolean;
  includeBookInfo?: boolean;
} = {}): Promise<Highlight[]> {
  return []
}

export async function fetchHighlightById(_id: string): Promise<Highlight | null> {
  return null
}

export async function createHighlight(_data: Partial<Highlight>): Promise<Highlight | null> {
  return null
}

export async function updateHighlight(_id: string, _data: Partial<Highlight>): Promise<Highlight | null> {
  return null
}

export async function deleteHighlight(_id: string): Promise<void> {}

export async function upsertChapterRating(_data: {
  bookId: string;
  chapterIndex: number;
  userId: string;
  rating: number;
}): Promise<ChapterRating | null> {
  return null
}

export async function fetchChapterRatings(_bookId: string, _chapterIndex?: number): Promise<ChapterRating[]> {
  return []
}

export async function createBookReview(_data: Partial<BookReview>): Promise<BookReview | null> {
  return null
}

export async function fetchBookReviews(_bookId: string): Promise<BookReview[]> {
  return []
}
