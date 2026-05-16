import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/lib/admin-auth';
import { supabaseAdminRequest } from '@/lib/supabase/admin-rest';
import { Order } from '@/lib/types';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await verifyAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await supabaseAdminRequest<Order[]>(
      '/rest/v1/orders?select=*&order=created_at.desc',
    );

    return Response.json(orders);
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
