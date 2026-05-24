import { requireAdminSession } from '@/lib/admin-session';
import { dbQuery } from '@/lib/db';
import { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await dbQuery<Order>(
      `
        SELECT
          id,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          items,
          total::float8 AS total,
          status,
          notes,
          created_at,
          updated_at
        FROM orders
        ORDER BY created_at DESC
      `,
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
