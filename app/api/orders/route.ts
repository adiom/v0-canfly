import { dbQueryOne } from '@/lib/db';
import { Order, OrderItem } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      items,
      notes
    } = body;

    // Validate required fields
    if (!customer_name || !customer_email || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total
    const total = items.reduce((sum: number, item: OrderItem) => 
      sum + (item.price * item.quantity), 0
    );

    const data = await dbQueryOne<Order>(
      `
        INSERT INTO orders (
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          items,
          total,
          notes,
          status
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, 'pending')
        RETURNING
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
      `,
      [
        customer_name,
        customer_email,
        customer_phone || null,
        customer_address || null,
        JSON.stringify(items),
        total,
        notes || null,
      ],
    );

    if (!data) {
      return Response.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return Response.json(data as Order, { status: 201 });
  } catch (error) {
    console.error('Error processing order:', error);
    return Response.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}
