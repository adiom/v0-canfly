import { createClient } from '@/lib/supabase/server';
import { Order } from '@/lib/types';

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data as Order[]);
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
