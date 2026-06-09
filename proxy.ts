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
    console.log('[proxy] /profile check', {
      authSecret: process.env.AUTH_SECRET ? `${process.env.AUTH_SECRET.slice(0, 10)}...` : 'MISSING',
      cookies: request.headers.get('cookie')?.slice(0, 100),
    })
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    })

    if (!token) {
      console.log(`[proxy] /profile redirect to /login — no token for path: ${pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    console.log(`[proxy] /profile allowed`, { userId: token.sub, roles: token.roles })
    return NextResponse.next({ request })
  }

  // --- Защита /admin — требуется роль admin ---
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    })

    if (!token) {
      console.log(`[proxy] /admin redirect to /login — no token for path: ${pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const roles = (token?.roles as string[]) || []
    if (!roles.includes('admin')) {
      console.log(`[proxy] /admin access denied`, { userId: token.sub, roles })
      // Авторизован, но не админ — показываем страницу с объяснением, а не тихий редирект
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    console.log(`[proxy] /admin allowed`, { userId: token.sub })
    return NextResponse.next({ request })
  }

  // --- Защита /studio — требуется роль author | editor | admin ---
  if (pathname.startsWith('/studio') && pathname !== '/studio-access-denied') {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    })

    if (!token) {
      console.log(`[proxy] /studio redirect to /login — no token for path: ${pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const roles = (token?.roles as string[]) || []
    const studioRoles = ['author', 'editor', 'admin']
    if (!roles.some((r) => studioRoles.includes(r))) {
      console.log(`[proxy] /studio access denied`, { userId: token.sub, roles })
      // Авторизован, но без нужной роли — показываем страницу с объяснением
      const url = request.nextUrl.clone()
      url.pathname = '/studio-access-denied'
      return NextResponse.redirect(url)
    }

    console.log(`[proxy] /studio allowed`, { userId: token.sub, roles })
    return NextResponse.next({ request })
  }

  // --- Авторизованный пользователь на /login → редирект на главную ---
  if (pathname === '/login') {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    })

    if (token) {
      console.log(`[proxy] /login redirect to / (already authenticated)`, { userId: token.sub })
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/studio/:path*', '/login'],
}
