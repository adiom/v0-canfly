import { dbQuery, dbQueryOne } from '@/lib/db'
import { Highlight, HighlightType, HighlightVisibility, HighlightStatus, ChapterRating, BookReview } from '@/lib/types'

const highlightColumns = `
  id,
  book_id,
  user_id,
  chapter_index,
  text_content,
  comment,
  type,
  visibility,
  status,
  range_data,
  created_at,
  updated_at
`

export async function fetchHighlights(options: {
  bookId?: string;
  userId?: string;
  type?: HighlightType;
  visibility?: HighlightVisibility;
  includeInternal?: boolean;
} = {}) {
  const params: any[] = [];
  let query = `SELECT ${highlightColumns} FROM highlights WHERE 1=1`;

  if (options.bookId) {
    params.push(options.bookId);
    query += ` AND book_id = $${params.length}`;
  }

  if (options.userId) {
    params.push(options.userId);
    query += ` AND user_id = $${params.length}`;
  }

  if (options.type) {
    params.push(options.type);
    query += ` AND type = $${params.length}`;
  }

  if (options.visibility) {
    params.push(options.visibility);
    query += ` AND visibility = $${params.length}`;
  } else if (!options.includeInternal) {
    query += ` AND visibility = 'public'`;
  }

  query += ` ORDER BY created_at DESC`;

  const results = await dbQuery<Highlight>(query, params);
  return results.map(row => ({
    ...row,
    type: String(row.type),
    visibility: String(row.visibility),
    status: String(row.status),
    range_data: typeof row.range_data === 'string' 
      ? JSON.parse(row.range_data) 
      : row.range_data || {}
  }));
}

export async function fetchHighlightById(id: string) {
  const result = await dbQueryOne<Highlight>(`SELECT ${highlightColumns} FROM highlights WHERE id = $1 LIMIT 1`, [id]);
  if (!result) return null;
  return {
    ...result,
    type: String(result.type),
    visibility: String(result.visibility),
    status: String(result.status),
    range_data: typeof result.range_data === 'string' 
      ? JSON.parse(result.range_data) 
      : result.range_data || {}
  };
}

export async function createHighlight(data: Partial<Highlight>) {
  const result = await dbQueryOne<Highlight>(
    `
      INSERT INTO highlights (
        book_id,
        user_id,
        chapter_index,
        text_content,
        comment,
        type,
        visibility,
        status,
        range_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${highlightColumns}
    `,
    [
      data.book_id,
      data.user_id,
      data.chapter_index,
      data.text_content,
      data.comment || null,
      data.type || 'quote',
      data.visibility || 'public',
      data.status || 'pending',
      JSON.stringify(data.range_data || {}),
    ]
  );
  if (!result) return null;
  return {
    ...result,
    type: String(result.type),
    visibility: String(result.visibility),
    status: String(result.status),
    range_data: typeof result.range_data === 'string' 
      ? JSON.parse(result.range_data) 
      : result.range_data || {}
  };
}

export async function updateHighlight(id: string, data: Partial<Highlight>) {
  const fields: string[] = [];
  const params: any[] = [id];

  if (data.comment !== undefined) {
    params.push(data.comment);
    fields.push(`comment = $${params.length}`);
  }
  if (data.status !== undefined) {
    params.push(data.status);
    fields.push(`status = $${params.length}`);
  }
  if (data.visibility !== undefined) {
    params.push(data.visibility);
    fields.push(`visibility = $${params.length}`);
  }

  if (fields.length === 0) return fetchHighlightById(id);

  const result = await dbQueryOne<Highlight>(
    `
      UPDATE highlights
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING ${highlightColumns}
    `,
    params
  );
  if (!result) return null;
  return {
    ...result,
    type: String(result.type),
    visibility: String(result.visibility),
    status: String(result.status),
    range_data: typeof result.range_data === 'string'
      ? JSON.parse(result.range_data)
      : result.range_data || {}
  };
}

export async function deleteHighlight(id: string) {
  await dbQuery('DELETE FROM highlights WHERE id = $1', [id]);
}

// Chapter Ratings
export async function upsertChapterRating(data: {
  bookId: string;
  chapterIndex: number;
  userId: string;
  rating: number;
}) {
  return dbQueryOne<ChapterRating>(
    `
      INSERT INTO chapter_ratings (book_id, chapter_index, user_id, rating)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (book_id, chapter_index, user_id)
      DO UPDATE SET rating = EXCLUDED.rating
      RETURNING *
    `,
    [data.bookId, data.chapterIndex, data.userId, data.rating]
  );
}

export async function fetchChapterRatings(bookId: string, chapterIndex?: number) {
  let query = `SELECT * FROM chapter_ratings WHERE book_id = $1`;
  const params: any[] = [bookId];

  if (chapterIndex !== undefined) {
    params.push(chapterIndex);
    query += ` AND chapter_index = $${params.length}`;
  }

  return dbQuery<ChapterRating>(query, params);
}

// Book Reviews
export async function createBookReview(data: Partial<BookReview>) {
  return dbQueryOne<BookReview>(
    `
      INSERT INTO book_reviews (book_id, user_id, rating, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [data.book_id, data.user_id, data.rating, data.content]
  );
}

export async function fetchBookReviews(bookId: string) {
  return dbQuery<BookReview>(
    `SELECT * FROM book_reviews WHERE book_id = $1 AND is_published = true ORDER BY created_at DESC`,
    [bookId]
  );
}
