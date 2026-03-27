import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Demo: Simple password check - in production use proper authentication
    const DEMO_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password !== DEMO_ADMIN_PASSWORD) {
      return Response.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Check if email exists in admins table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return Response.json(
        { error: 'Email не зарегистрирован как администратор' },
        { status: 401 }
      );
    }

    // Generate simple token (in production use JWT)
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    return Response.json({
      token,
      email,
      message: 'Успешный вход'
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    );
  }
}
