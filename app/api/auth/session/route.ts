import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUserFromCookie, getUserRoles } from '@/lib/server/users'
import { USER_SESSION_COOKIE, verifyUserToken } from '@/lib/user-auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    // Проверяем именно JWT-сессию (не анонимный reader cookie)
    const sessionToken = cookieStore.get(USER_SESSION_COOKIE)?.value
    const session = await verifyUserToken(sessionToken)
    const isAuthenticated = !!session

    const user = await getCurrentUserFromCookie()
    
    if (!user) {
      return NextResponse.json({ user: null, roles: [], isAuthenticated: false })
    }

    const roles = await getUserRoles(user.id)

    return NextResponse.json({
      user,
      roles,
      isAuthenticated,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null, roles: [], isAuthenticated: false })
  }
}
