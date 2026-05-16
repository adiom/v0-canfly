import { cookies } from 'next/headers'
import { headers } from 'next/headers'

import { ADMIN_SESSION_COOKIE, isLocalAdminHostname, verifyAdminToken } from '@/lib/admin-auth'

function getHostnameFromHostHeader(host: string) {
  if (host.startsWith('[')) {
    return host.slice(1, host.indexOf(']'))
  }

  return host.split(':')[0] || ''
}

export async function requireAdminSession() {
  const headerStore = await headers()
  const hostname = getHostnameFromHostHeader(headerStore.get('host') || '')

  if (isLocalAdminHostname(hostname)) {
    return { email: 'local-admin@localhost' }
  }

  const cookieStore = await cookies()
  const session = await verifyAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)

  if (!session) {
    return null
  }

  return session
}
