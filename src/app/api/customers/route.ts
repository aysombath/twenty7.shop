import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';
import { redis, CACHE_KEYS } from '@/lib/redis';

/**
 * Master Client Index API
 * Curating the Precision Atelier Relationship Vault
 */

/**
 * Runs all necessary schema migrations on the customers table.
 * Safe to call on every request — uses IF NOT EXISTS throughout.
 */
async function ensureCustomersSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      orders INTEGER DEFAULT 0,
      total_spent DECIMAL(12, 2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active',
      role VARCHAR(100) DEFAULT 'Client',
      last_order TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Incremental column migrations — safe to run repeatedly
  const migrations = [
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS username VARCHAR(255)`,
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT`,
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar TEXT`,
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password VARCHAR(255)`,
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'Client'`,
  ];

  // Run migrations, but ignore errors (column already exists etc.)
  await Promise.allSettled(migrations);
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
      return NextResponse.json({ success: false, error: "Access Denied: Architectural credentials missing or invalid." }, { status: 401 });
    }

    if (!await checkServerPermission("view_customers")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient for this vault query." }, { status: 403 });
    }

    // Attempt cache retrieval — Precision Atelier Latency Management
    try {
      const [cachedList, cachedStats] = await Promise.all([
        redis.get(CACHE_KEYS.CUSTOMERS_LIST),
        redis.get(CACHE_KEYS.CUSTOMERS_STATS)
      ]);

      if (cachedList && cachedStats) {
        return NextResponse.json({
          success: true,
          data: cachedList,
          stats: cachedStats,
          cache: "HIT",
          timestamp: new Date().toISOString(),
          base: "Precision Atelier - Client Vault"
        });
      }
    } catch (redisError) {
      console.warn("Redis Cache Access Failure:", redisError);
    }

    await ensureCustomersSchema();

    // MISS: Query master database with dynamic aggregations from orders and invoices tables
    const customers = await sql`
      SELECT 
        c.*, 
        (SELECT COUNT(*)::int FROM orders o WHERE LOWER(o.customer_name) = LOWER(c.name) AND LOWER(o.status) = 'completed') as completed_orders,
        (SELECT COUNT(*)::int FROM invoices i WHERE LOWER(i.customer_email) = LOWER(c.email) AND LOWER(i.status) = 'paid') as paid_invoices,
        (
          (SELECT COUNT(*)::int FROM orders o WHERE LOWER(o.customer_name) = LOWER(c.name) AND LOWER(o.status) = 'completed') + 
          (SELECT COUNT(*)::int FROM invoices i WHERE LOWER(i.customer_email) = LOWER(c.email) AND LOWER(i.status) = 'paid')
        ) as orders,
        (SELECT COALESCE(SUM(total_price), 0)::float FROM invoices i WHERE LOWER(i.customer_email) = LOWER(c.email)) as total_spent,
        (SELECT MAX(created_at) FROM invoices i WHERE LOWER(i.customer_email) = LOWER(c.email)) as last_order_date
      FROM customers c
      ORDER BY c.created_at DESC
    `;

    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_customers,
        SUM(COALESCE((SELECT SUM(total_price) FROM invoices i WHERE i.customer_email = c.email), 0)) as total_ltv,
        COUNT(*) FILTER (WHERE status = 'Active' OR status = 'VIP') as active_count
      FROM customers c
    `;
    const stats = statsResult[0];

    // Update Cache (1 hour TTL)
    try {
      await Promise.all([
        redis.set(CACHE_KEYS.CUSTOMERS_LIST, customers, { ex: 3600 }),
        redis.set(CACHE_KEYS.CUSTOMERS_STATS, stats, { ex: 3600 })
      ]);
    } catch (setCacheError) {
      console.warn("Cache Refresh Failure:", setCacheError);
    }

    return NextResponse.json({
      success: true,
      data: customers,
      stats: stats,
      cache: "MISS",
      timestamp: new Date().toISOString(),
      base: "Precision Atelier - Client Vault"
    });
  } catch (error: any) {
    console.error("Customer GET error:", error.message);
    return NextResponse.json({
      success: false,
      error: "Neon Relationship Database offline.",
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
       return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });
    }

    if (!await checkServerPermission("create_customers")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to enroll client." }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, email, phone, address, status, avatar, password, role } = body;

    if (!name || !email) {
      return NextResponse.json({
        success: false,
        error: "Name and email are required fields."
      }, { status: 400 });
    }

    // Always ensure schema is up to date before inserting
    await ensureCustomersSchema();

    const result = await sql`
      INSERT INTO customers (name, username, email, phone, address, status, avatar, password, role)
      VALUES (
        ${name},
        ${username || null},
        ${email},
        ${phone || null},
        ${address || null},
        ${status || 'Active'},
        ${avatar || null},
        ${password || null},
        ${role || 'Client'}
      )
      RETURNING *
    `;

    // Invalidate Cache
    try {
      await Promise.all([
        redis.del(CACHE_KEYS.CUSTOMERS_LIST),
        redis.del(CACHE_KEYS.CUSTOMERS_STATS)
      ]);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "Client identity registered in the relationship index."
    });
  } catch (error: any) {
    console.error("Customer POST error:", error.message);

    const isDuplicate = error.message?.toLowerCase().includes('unique') ||
                        error.message?.toLowerCase().includes('duplicate');

    return NextResponse.json({
      success: false,
      error: isDuplicate
        ? "A customer with this email or username already exists."
        : "Failed to enroll client identity.",
      details: error.message
    }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
       return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });
    }

    if (!await checkServerPermission("edit_customers")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to modify client tier." }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, username, email, phone, address, status, role } = body;

    if (!id) return NextResponse.json({ success: false, error: "Identity reference required." }, { status: 400 });

    const result = await sql`
      UPDATE customers 
      SET 
        name = COALESCE(${name}, name),
        username = COALESCE(${username}, username),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        address = COALESCE(${address}, address),
        status = COALESCE(${status}, status),
        role = COALESCE(${role}, role)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });

    // Invalidate Cache
    try {
      await Promise.all([
        redis.del(CACHE_KEYS.CUSTOMERS_LIST),
        redis.del(CACHE_KEYS.CUSTOMERS_STATS)
      ]);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "Client identity synchronized."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Master tier update failure.",
      details: error.message
    }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
       return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });
    }

    if (!await checkServerPermission("delete_customers")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient for relationship purge." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Missing identity reference." }, { status: 400 });

    await sql`DELETE FROM customers WHERE id = ${id}`;

    // Invalidate Cache
    try {
      await Promise.all([
        redis.del(CACHE_KEYS.CUSTOMERS_LIST),
        redis.del(CACHE_KEYS.CUSTOMERS_STATS)
      ]);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: "Relationship record permanently purged."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Purge failure.",
      details: error.message
    }, { status: 400 });
  }
}
