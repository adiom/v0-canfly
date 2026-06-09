import { dbQueryOne } from '@/lib/db'

interface MagicTokenData {
  email: string
  userId: string
}

export async function validateAndConsumeMagicToken(token: string): Promise<MagicTokenData | null> {
  if (!token) return null

  const record = await dbQueryOne<{ id: string; email: string; expires_at: string; used: boolean }>(
    'SELECT * FROM magic_tokens WHERE token = $1 LIMIT 1',
    [token],
  )
  if (!record) return null
  if (new Date(record.expires_at) < new Date()) return null
  if (record.used) return null

  let existing = await dbQueryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [record.email],
  )

  if (!existing) {
    const handle = `user-${crypto.randomUUID().slice(0, 8)}`
    const created = await dbQueryOne<{ id: string }>(
      `INSERT INTO users (email, handle, display_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [record.email, handle, handle],
    )
    if (!created) return null
    existing = created

    await dbQueryOne(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1, 'reader')
       ON CONFLICT DO NOTHING`,
      [existing.id],
    )
  }

  await dbQueryOne(
    `UPDATE magic_tokens SET used = true WHERE token = $1`,
    [token],
  )

  return { email: record.email, userId: existing.id }
}
