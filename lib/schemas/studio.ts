import { z } from 'zod'

/**
 * Zod-схемы для Studio server actions (release / edition / chapter / series).
 * Валидируют FormData (всё string/null), приводят к нужным типам и проверяют
 * enum'ы, соответствующие postgres-типам (см. postgres/002_release_system.sql).
 *
 * Ранее actions передавали formData.get(...) в БД напрямую без какой-либо
 * валидации — теперь статус/формат проверяются против enum.
 */

// --- Enum'ы, синхронизированные с postgres types ---

export const releaseStatusSchema = z.enum(['draft', 'published', 'archived'])
export const editionStatusSchema = z.enum(['draft', 'published', 'archived'])
export const editionFormatSchema = z.enum(['book', 'comic', 'audiobook', 'audiorelease', 'album', 'magazine'])
export const chapterStatusSchema = z.enum(['draft', 'published'])
export const qualityTierSchema = z.enum(['draft', 'standard', 'premium'])

// --- Общие хелперы для FormData (значения приходят строкой или null) ---

/** Пустая строка или null → null, иначе обрезанная строка. */
const optionalString = z
  .union([z.string(), z.null()])
  .transform((v) => (v == null || v === '' ? null : v.trim()))

/** Строка-обязательная; trim, минимум 1 символ. */
const requiredString = z
  .string()
  .trim()
  .min(1, 'Поле обязательно')

/** Slug: латиница/цифры/дефис. */
const slugSchema = requiredString.regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Slug: только латиница, цифры и дефисы',
)

// --- Release ---

export const releaseFormSchema = z.object({
  title: requiredString.max(300, 'Слишком длинное название'),
  slug: slugSchema,
  description: optionalString,
  cover_image: optionalString,
  genre: optionalString,
  release_date: optionalString,
  isbn: optionalString,
  authors: z.array(z.any()), // массив уже распарсен в action через parseJsonArray
  annotation: optionalString,
  editor_notes: optionalString,
  status: releaseStatusSchema.default('draft'),
})

// --- Edition ---

export const editionFormSchema = z.object({
  release_id: requiredString,
  format: editionFormatSchema.default('book'),
  platform: optionalString,
  external_url: optionalString,
  slug: slugSchema,
  is_primary: z
  .union([z.literal('true'), z.literal('false'), z.null()])
  .transform((v) => v === 'true')
  .default('false'),
})

// --- Chapter ---

export const chapterFormSchema = z.object({
  edition_id: requiredString,
  title: optionalString,
})

export const chapterUpdateSchema = z.object({
  title: optionalString,
  content: optionalString,
  chapter_index: z.number().int().min(1).optional(),
})

// --- Series ---

export const seriesFormSchema = z.object({
  title: requiredString.max(200, 'Слишком длинное название'),
  slug: slugSchema,
  description: optionalString,
})

/** Достаёт первое человекочитаемое сообщение об ошибке из ZodError. */
export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0]
  if (!first) return 'Ошибка валидации'
  return first.message
}
