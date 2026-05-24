import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, isLocalAdminHostname, verifyAdminToken } from '@/lib/admin-auth'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminLoginPage = pathname === '/admin/login'
  const isLocalAdmin = isLocalAdminHostname(request.nextUrl.hostname)

  if (isAdminPage) {
    if (isLocalAdmin && isAdminLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (isLocalAdmin) {
      return NextResponse.next({ request })
    }

    const session = await verifyAdminToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)

    if (!session && !isAdminLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    if (session && isAdminLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      url.search = ''
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  return NextResponse.next({ request })
}
