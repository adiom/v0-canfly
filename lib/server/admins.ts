import { dbQueryOne } from '@/lib/db'

export async function findAdminByEmail(email: string) {
  return dbQueryOne<{ email: string }>('SELECT email FROM admins WHERE email = $1 LIMIT 1', [
    email.toLowerCase(),
  ])
}
