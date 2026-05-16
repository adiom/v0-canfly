import { cookies } from 'next/headers'

import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/lib/admin-auth'

export async function requireAdminSession() {
  const cookieStore = await cookies()
  const session = await verifyAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)

  if (!session) {
    return null
  }

  return session
}

