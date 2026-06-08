import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- next-auth роуты — пропускаем ---
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/magic') ||
    pathname.startsWith('/hi/')
  ) {
    return NextResponse.next()
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

  // --- Защита /admin — требуется роль admin ---
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
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

    const roles = (token?.roles as string[]) || []
    if (!roles.includes('admin')) {
      // Авторизован, но не админ — показываем страницу с объяснением, а не тихий редирект
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  // --- Защита /studio — требуется роль author | editor | admin ---
  if (pathname.startsWith('/studio') && pathname !== '/studio-access-denied') {
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

    const roles = (token?.roles as string[]) || []
    const studioRoles = ['author', 'editor', 'admin']
    if (!roles.some((r) => studioRoles.includes(r))) {
      // Авторизован, но без нужной роли — показываем страницу с объяснением
      const url = request.nextUrl.clone()
      url.pathname = '/studio-access-denied'
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
  matcher: ['/profile/:path*', '/admin/:path*', '/studio/:path*', '/login'],
}
