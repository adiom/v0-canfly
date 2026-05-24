import { ADMIN_SESSION_COOKIE, createAdminToken } from '@/lib/admin-auth';
import { findAdminByEmail } from '@/lib/server/admins';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Demo: Simple password check - in production use proper authentication
    const DEMO_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (!normalizedEmail || password !== DEMO_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const admin = await findAdminByEmail(normalizedEmail);

    if (!admin) {
      return NextResponse.json(
        { error: 'Email не зарегистрирован как администратор' },
        { status: 401 }
      );
    }

    const token = await createAdminToken(normalizedEmail);
    const response = NextResponse.json({
      email: normalizedEmail,
      message: 'Успешный вход'
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    );
  }
}
