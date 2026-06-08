import { NextResponse } from 'next/server'
import { getCurrentUser, getUserRoles } from '@/lib/server/session'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null, roles: [], isAuthenticated: false })
    }

    const roles = await getUserRoles(user.id)
    const isAuthenticated = true

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
