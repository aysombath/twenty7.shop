import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { redis, CACHE_KEYS } from '@/lib/redis';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const result = await sql`
      SELECT * FROM orders 
      WHERE order_number = ${id} OR id::text = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    
    const orderData = result[0];
    
    // Format address object safely
    orderData.address = {
      country: orderData.country || "US",
      street: orderData.street_address || "",
      city: orderData.city || "",
      state: orderData.state || "",
      zip: orderData.zip_code || ""
    };
    
    let items: any[] = [];
    try {
      const itemsRes = await sql`
        SELECT id, product_id, quantity, unit_price 
        FROM order_items 
        WHERE order_id = ${orderData.order_number}
      `;
      items = itemsRes.map((i: any) => ({
        id: i.id.toString(),
        productId: i.product_id,
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unit_price) || 0
      }));
    } catch (err: any) {
      if (err.message?.includes('relation "order_items" does not exist') || err.code === '42P01') {
        await sql`
          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id VARCHAR(50) REFERENCES orders(order_number) ON DELETE CASCADE,
            product_id VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
      } else {
        console.warn("Order Items fetch error:", err);
      }
    }
    
    orderData.items = items;

    return NextResponse.json({ success: true, data: orderData });
  } catch (error: any) {
    console.error("Orders API [id] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    
    const { status, currency, customer_name, total_price, items, notes, address } = body;
    
    try {
      await sql`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS country VARCHAR(2),
        ADD COLUMN IF NOT EXISTS street_address TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS zip_code VARCHAR(50);
      `;
    } catch(e) { console.warn("Could not alter table for notes & address", e) }

    await sql`
      UPDATE orders
      SET 
        status = COALESCE(${status || null}, status),
        currency = COALESCE(${currency || null}, currency),
        customer_name = COALESCE(${customer_name || null}, customer_name),
        total_price = COALESCE(${total_price !== undefined ? total_price : null}, total_price),
        notes = ${notes !== undefined ? notes : null},
        country = ${address?.country || null},
        street_address = ${address?.street || null},
        city = ${address?.city || null},
        state = ${address?.state || null},
        zip_code = ${address?.zip || null}
      WHERE order_number = ${id} OR id::text = ${id}
    `;

    // Handle items
    if (items && Array.isArray(items)) {
      try {
        const orderRes = await sql`SELECT order_number FROM orders WHERE order_number = ${id} OR id::text = ${id}`;
        if (orderRes.length > 0) {
          const orderNum = orderRes[0].order_number;
          
          await sql`
            CREATE TABLE IF NOT EXISTS order_items (
              id SERIAL PRIMARY KEY,
              order_id VARCHAR(50) REFERENCES orders(order_number) ON DELETE CASCADE,
              product_id VARCHAR(255) NOT NULL,
              quantity INTEGER NOT NULL DEFAULT 1,
              unit_price DECIMAL(10,2) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;
          
          await sql`DELETE FROM order_items WHERE order_id = ${orderNum}`;
          for (const item of items) {
            await sql`
              INSERT INTO order_items (order_id, product_id, quantity, unit_price)
              VALUES (${orderNum}, ${item.productId || 'Unknown'}, ${item.quantity || 1}, ${item.unitPrice || 0})
            `;
          }
        }
      } catch (err) {
        console.warn("Order Items update error (table may be missing):", err);
      }
    }

    try { await redis.del(CACHE_KEYS.ORDERS_LIST); } catch(e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Orders API [id] PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
