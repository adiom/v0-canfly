import { z } from 'zod'

const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/

export const postTypeSchema = z.enum(['thought', 'announcement', 'question'])
export type PostType = z.infer<typeof postTypeSchema>

const optionalIsoDateTime = z
  .string()
  .refine((v) => ISO_DATETIME_RE.test(v) || v === '', {
    message: 'Некорректный формат даты',
  })
  .transform((v) => (v === '' ? null : new Date(v).toISOString()))
  .nullable()
  .optional()

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\//i.test(v), {
    message: 'Некорректный URL',
  })
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()

export const createCharacterPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Текст обязателен')
    .max(10000, 'Слишком длинный пост'),
  post_type: postTypeSchema.default('thought'),
  image_url: optionalUrl,
  scheduled_at: optionalIsoDateTime,
  remove_image: z
    .union([z.literal('true'), z.literal('false'), z.literal('')])
    .transform((v) => v === 'true')
    .optional(),
})

export const updateCharacterPostSchema = createCharacterPostSchema.partial()

export const wallPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Текст не может быть пустым')
    .max(2000, 'Слишком длинное сообщение'),
})

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0]
  if (!first) return 'Ошибка валидации'
  return first.message
}
