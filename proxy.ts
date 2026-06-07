import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ADMIN_SESSION_COOKIE, isLocalAdminHostname, verifyAdminToken } from '@/lib/admin-auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- next-auth и magic link роуты — пропускаем без проверок ---
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/magic') ||
    pathname.startsWith('/hi/')
  ) {
    return NextResponse.next()
  }

  // --- Защита /admin ---
  if (pathname.startsWith('/admin')) {
    const isAdminLoginPage = pathname === '/admin/login'
    const isLocalAdmin = isLocalAdminHostname(request.nextUrl.hostname)

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

  // --- Защита /profile через next-auth JWT ---
  if (pathname.startsWith('/profile')) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    })

    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  // --- Авторизованный пользователь на /login → редирект на главную ---
  if (pathname === '/login') {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    })

    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
