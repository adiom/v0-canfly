import { NextRequest, NextResponse } from 'next/server'
import { dbQueryOne } from '@/lib/db'
import { Order, OrderItem } from '@/lib/types'
import { apiHandler } from '@/lib/api-handler'

async function createOrder(request: NextRequest) {
  const body = await request.json()
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    items,
    notes,
  } = body

  if (!customer_name || !customer_email || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  const total = items.reduce((sum: number, item: OrderItem) =>
    sum + (item.price * item.quantity), 0,
  )

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
  )

  if (!data) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  return NextResponse.json(data as Order, { status: 201 })
}

export const POST = apiHandler(createOrder)