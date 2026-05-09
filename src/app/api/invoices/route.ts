import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { redis } from '@/lib/redis'

const CACHE_KEY = 'invoices:list'

// ─── Ensure tables exist ────────────────────────────────────────────────────
async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id               SERIAL PRIMARY KEY,
      invoice_number   VARCHAR(100) UNIQUE NOT NULL,
      seller_name      VARCHAR(255),
      customer_name    VARCHAR(255) NOT NULL,
      biller_address   TEXT,
      status           VARCHAR(50)  DEFAULT 'draft',
      currency         VARCHAR(10)  DEFAULT 'USD',
      subtotal         DECIMAL(12,2) DEFAULT 0,
      tax_amount       DECIMAL(12,2) DEFAULT 0,
      discount_amount  DECIMAL(12,2) DEFAULT 0,
      discount_type    VARCHAR(255),
      total_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
      customer_email   VARCHAR(255),
      customer_phone   VARCHAR(50),
      issue_date       DATE,
      due_date         DATE,
      notes            TEXT,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id              SERIAL PRIMARY KEY,
      invoice_number  VARCHAR(100) REFERENCES invoices(invoice_number) ON DELETE CASCADE,
      description     TEXT NOT NULL,
      quantity        DECIMAL(10,3) DEFAULT 1,
      unit_price      DECIMAL(12,2) DEFAULT 0,
      tax_rate        DECIMAL(5,2)  DEFAULT 0,
      total           DECIMAL(12,2) DEFAULT 0,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  
  // Migration: Add customer contact info if missing
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)`
  } catch (e) {
    console.error('Migration error:', e)
  }
}

// ─── POST — Create Invoice ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      order_number,
      invoice_number,
      seller_name,
      customer_name,
      address,
      status = 'draft',
      currency = 'USD',
      subtotal   = 0,
      tax_amount = 0,
      discount_amount = 0,
      discount_type,
      total_price = 0,
      order_date,
      due_date,
      notes,
      customer_email,
      customer_phone,
      items = [],
    } = body

    const invNumber = invoice_number || order_number
    if (!invNumber) {
      return NextResponse.json(
        { success: false, error: 'invoice_number is required' },
        { status: 400 }
      )
    }

    await ensureTables()

    const billerAddr = address?.street || null
    const issueDate  = order_date ? new Date(order_date).toISOString().split('T')[0] : null
    const dueDate    = due_date   ? new Date(due_date).toISOString().split('T')[0]   : null

    // Upsert invoice row
    await sql`
      INSERT INTO invoices (
        invoice_number, seller_name, customer_name, biller_address,
        status, currency,
        subtotal, tax_amount, discount_amount, discount_type,
        total_price, customer_email, customer_phone, issue_date, due_date, notes
      ) VALUES (
        ${invNumber},
        ${seller_name || null},
        ${customer_name || 'Unknown'},
        ${billerAddr},
        ${status},
        ${currency},
        ${Number(subtotal)},
        ${Number(tax_amount)},
        ${Number(discount_amount)},
        ${discount_type || null},
        ${Number(total_price)},
        ${customer_email || null},
        ${customer_phone || null},
        ${issueDate},
        ${dueDate},
        ${notes || null}
      )
      ON CONFLICT (invoice_number) DO UPDATE SET
        seller_name     = EXCLUDED.seller_name,
        customer_name   = EXCLUDED.customer_name,
        biller_address  = EXCLUDED.biller_address,
        status          = EXCLUDED.status,
        currency        = EXCLUDED.currency,
        subtotal        = EXCLUDED.subtotal,
        tax_amount      = EXCLUDED.tax_amount,
        discount_amount = EXCLUDED.discount_amount,
        discount_type   = EXCLUDED.discount_type,
        total_price     = EXCLUDED.total_price,
        customer_email  = EXCLUDED.customer_email,
        customer_phone  = EXCLUDED.customer_phone,
        issue_date      = EXCLUDED.issue_date,
        due_date        = EXCLUDED.due_date,
        notes           = EXCLUDED.notes,
        updated_at      = CURRENT_TIMESTAMP
    `

    // Insert / replace line items
    if (items.length > 0) {
      await sql`DELETE FROM invoice_items WHERE invoice_number = ${invNumber}`
      for (const item of items) {
        await sql`
          INSERT INTO invoice_items (invoice_number, description, quantity, unit_price, tax_rate, total)
          VALUES (
            ${invNumber},
            ${item.description || 'Service'},
            ${Number(item.quantity || 1)},
            ${Number(item.unit_price || 0)},
            ${Number(item.tax_rate  || 0)},
            ${Number(item.total     || 0)}
          )
        `
      }
    }

    // Bust cache
    try { await redis.del(CACHE_KEY) } catch (_) {}

    return NextResponse.json({
      success: true,
      message: status === 'draft' ? 'Invoice saved as draft' : 'Invoice created',
      invoice_number: invNumber,
    })
  } catch (error: any) {
    console.error('Invoices POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ─── GET — List Invoices ─────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    // Check cache
    const { searchParams } = new URL(req.url)
    const customer_email = searchParams.get('customer_email')

    if (!customer_email) {
      try {
        const cached = await redis.get(CACHE_KEY)
        if (cached) return NextResponse.json({ success: true, data: typeof cached === 'string' ? JSON.parse(cached) : cached, cache: 'HIT' })
      } catch (_) {}
    }

    await ensureTables()

    let invoices;
    if (customer_email) {
      invoices = await sql`
        SELECT 
          inv.*,
          COALESCE(
            json_agg(
              json_build_object(
                'description', ii.description,
                'quantity',    ii.quantity,
                'unit_price',  ii.unit_price,
                'tax_rate',    ii.tax_rate,
                'total',       ii.total
              )
            ) FILTER (WHERE ii.id IS NOT NULL),
            '[]'
          ) AS items
        FROM invoices inv
        LEFT JOIN invoice_items ii ON ii.invoice_number = inv.invoice_number
        WHERE LOWER(inv.customer_email) = LOWER(${customer_email})
        GROUP BY inv.id
        ORDER BY inv.created_at DESC
      `
    } else {
      invoices = await sql`
        SELECT 
          inv.*,
          COALESCE(
            json_agg(
              json_build_object(
                'description', ii.description,
                'quantity',    ii.quantity,
                'unit_price',  ii.unit_price,
                'tax_rate',    ii.tax_rate,
                'total',       ii.total
              )
            ) FILTER (WHERE ii.id IS NOT NULL),
            '[]'
          ) AS items
        FROM invoices inv
        LEFT JOIN invoice_items ii ON ii.invoice_number = inv.invoice_number
        GROUP BY inv.id
        ORDER BY inv.created_at DESC
      `
    }

    // Seed sample data if empty
    if (invoices.length === 0) {
      const samples = [
        { num: 'INV-2026-001', seller: 'Sebastian Thorne', customer: 'Acme Corporation',   status: 'sent',  currency: 'USD', total: 2025.00 },
        { num: 'INV-2026-002', seller: 'Sebastian Thorne', customer: 'Globex Inc.',         status: 'draft', currency: 'USD', total: 890.00  },
        { num: 'INV-2026-003', seller: 'Jane Harper',      customer: 'Stark Industries',    status: 'paid',  currency: 'KHR', total: 1500.00 },
      ]
      for (const s of samples) {
        await sql`
          INSERT INTO invoices (invoice_number, seller_name, customer_name, status, currency, total_price)
          VALUES (${s.num}, ${s.seller}, ${s.customer}, ${s.status}, ${s.currency}, ${s.total})
          ON CONFLICT (invoice_number) DO NOTHING
        `
      }
      const refreshed = await sql`SELECT * FROM invoices ORDER BY created_at DESC`
      try { await redis.set(CACHE_KEY, refreshed, { ex: 3600 }) } catch (_) {}
      return NextResponse.json({ success: true, data: refreshed, cache: 'SEED' })
    }

    try { await redis.set(CACHE_KEY, invoices, { ex: 3600 }) } catch (_) {}

    return NextResponse.json({ success: true, data: invoices, cache: 'MISS' })
  } catch (error: any) {
    console.error('Invoices GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ─── PATCH — Update Status ───────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status are required' },
        { status: 400 }
      )
    }

    await ensureTables()

    await sql`
      UPDATE invoices
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE invoice_number = ${id} OR id::text = ${id}
    `

    try { await redis.del(CACHE_KEY) } catch (_) {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invoices PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ─── DELETE — Remove Invoice ─────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query param is required' },
        { status: 400 }
      )
    }

    await ensureTables()

    // Items cascade via FK, but being explicit
    await sql`DELETE FROM invoice_items WHERE invoice_number = ${id}`
    await sql`DELETE FROM invoices WHERE invoice_number = ${id} OR id::text = ${id}`

    try { await redis.del(CACHE_KEY) } catch (_) {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invoices DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
