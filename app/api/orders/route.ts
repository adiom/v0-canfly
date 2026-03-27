import { createClient } from '@/lib/supabase/server';
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

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        customer_address: customer_address || null,
        items,
        total,
        notes: notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return Response.json({ error: error.message }, { status: 500 });
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
