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
  matcher: ['/profile/:path*', '/admin/:path*', '/login'],
}
