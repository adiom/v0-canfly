import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, dbQueryOne } from '@/lib/db'
import { getCurrentUserFromCookie } from '@/lib/server/users'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie()
    console.log('[GET /api/chapters/rate] user:', user?.id ?? 'null')

    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const bookId = request.nextUrl.searchParams.get('bookId')
    console.log('[GET /api/chapters/rate] bookId:', bookId)

    if (!bookId) {
      return NextResponse.json({ error: 'bookId обязателен' }, { status: 400 })
    }

    // Получаем все рейтинги пользователя для этой книги
    const ratings = await dbQuery<{ chapter_index: number; rating: number }>(
      'SELECT chapter_index, rating FROM chapter_ratings WHERE book_id = $1 AND user_id = $2',
      [bookId, user.id]
    )
    console.log('[GET /api/chapters/rate] ratings count:', ratings.length)

    // Преобразуем в объект { chapterIndex: rating }
    const ratingsMap = ratings.reduce((acc, r) => {
      acc[r.chapter_index] = r.rating
      return acc
    }, {} as Record<number, number>)

    return NextResponse.json({ data: ratingsMap })
  } catch (error) {
    console.error('[GET /api/chapters/rate] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie()
    console.log('[POST /api/chapters/rate] user:', user?.id ?? 'null')

    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { bookId, chapterIndex, rating } = await request.json()
    console.log('[POST /api/chapters/rate] params:', { bookId, chapterIndex, rating })

    if (!bookId || chapterIndex === undefined || !rating) {
      return NextResponse.json({ error: 'Не все параметры переданы' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Рейтинг должен быть от 1 до 5' }, { status: 400 })
    }

    // Upsert рейтинга
    const result = await dbQueryOne(
      `INSERT INTO chapter_ratings (book_id, chapter_index, user_id, rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (book_id, chapter_index, user_id)
       DO UPDATE SET rating = $4, created_at = NOW()
       RETURNING *`,
      [bookId, chapterIndex, user.id, rating]
    )
    console.log('[POST /api/chapters/rate] result:', result?.id ?? 'null')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[POST /api/chapters/rate] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
