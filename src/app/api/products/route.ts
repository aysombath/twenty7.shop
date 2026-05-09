import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';
import { redis, CACHE_KEYS } from '@/lib/redis';

/**
 * Master Product Index API — Precision Atelier Catalog
 */

// ── Database Schema Migration ────────────────────────────────────────────────
async function ensureSchema() {
  try {
    // 1. Base Table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        sku VARCHAR(100) UNIQUE,
        description TEXT,
        tags TEXT[],
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    // 2. Proactive Migrations
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10,2)`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_per_item DECIMAL(10,2)`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(255)`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS security_stock INTEGER DEFAULT 0`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_returnable BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_shippable BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::JSONB`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10,2)`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_start TIMESTAMP`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_end TIMESTAMP`;
  } catch (err) {
    console.error("Schema sync failed:", err);
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);
    const isAdmin = isSessionValid || isTokenValid;

    // Cache lookup
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
       const product = await sql`
         SELECT p.*, b.name AS brand_name, c.name AS category_name
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON (c.id::text = p.category)
         WHERE p.id = ${id}
       `;
       if (product.length === 0) {
          return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
       }
       return NextResponse.json({ success: true, data: product[0] });
    }

    // Cache lookup
    try {
      const cacheKey = isAdmin ? CACHE_KEYS.PRODUCTS_LIST : `${CACHE_KEYS.PRODUCTS_LIST}_PUBLIC`;
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ success: true, data: cached, cache: "HIT" });
    } catch (e) {}

    await ensureSchema();

    // Data Migration
    await sql`
      UPDATE products 
      SET brand_id = (tags[1])::integer
      WHERE brand_id IS NULL 
      AND Array_Length(tags, 1) > 0 
      AND tags[1] ~ '^[0-9]+$'
    `;

    // 3. Query with names resolved via JOIN
    const products = isAdmin 
      ? await sql`
        SELECT p.*, b.name AS brand_name, c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON (c.id::text = p.category)
        ORDER BY p.created_at DESC
      `
      : await sql`
        SELECT p.*, b.name AS brand_name, c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON (c.id::text = p.category)
        WHERE p.status = 'Active'
        ORDER BY p.created_at DESC
      `;

    // Save to cache
    try { 
      const cacheKey = isAdmin ? CACHE_KEYS.PRODUCTS_LIST : `${CACHE_KEYS.PRODUCTS_LIST}_PUBLIC`;
      await redis.set(cacheKey, products, { ex: 3600 }); 
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: products,
      cache: "MISS",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("DB error", error);
    return NextResponse.json({ success: false, error: "Database error.", details: error.message }, { status: 500 });
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
    if (!await checkServerPermission("create_products")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, category, price, sku, stock, image_url, description, tags, 
      slug, comparePrice, costPerItem, barcode, securityStock, isReturnable, isShippable,
      brand_id, variants, discountPrice, discountStart, discountEnd 
    } = body;

    await ensureSchema();

    // Ensure numeric brand_id
    const bId = brand_id ? parseInt(String(brand_id)) : null;

    const result = await sql`
      INSERT INTO products (
        name, category, price, sku, stock, image_url, description, tags, 
        slug, compare_price, cost_per_item, barcode, security_stock, 
        is_returnable, is_shippable, brand_id, variants, discount_price,
        discount_start, discount_end
      ) VALUES (
        ${name}, ${category}, ${price}, ${sku}, ${stock ?? 0}, 
        ${image_url ?? null}, ${description ?? null}, ${tags ?? null}, 
        ${slug ?? null}, ${comparePrice ?? null}, ${costPerItem ?? null}, 
        ${barcode ?? null}, ${securityStock ?? 0}, 
        ${isReturnable ?? true}, ${isShippable ?? true}, ${bId}, 
        ${JSON.stringify(variants ?? [])}, ${discountPrice ?? null},
        ${discountStart ?? null}, ${discountEnd ?? null}
      )
      RETURNING *
    `;

    // Invalidate cache
    try { 
      await redis.del(CACHE_KEYS.PRODUCTS_LIST); 
      await redis.del(`${CACHE_KEYS.PRODUCTS_LIST}_PUBLIC`);
    } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error("POST error", error);
    return NextResponse.json({ success: false, error: "Registration failure.", details: error.message }, { status: 400 });
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
    if (!await checkServerPermission("edit_products")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient." }, { status: 403 });
    }

    await ensureSchema();
    const body = await request.json();
    const { 
      id, name, category, price, status, sku, description, image_url, tags, stock, 
      slug, comparePrice, costPerItem, barcode, securityStock, isReturnable, isShippable,
      brand_id, variants, discountPrice, discountStart, discountEnd 
    } = body;

    const bId = brand_id ? parseInt(String(brand_id)) : null;

    const result = await sql`
      UPDATE products SET 
        name = ${name}, 
        category = ${category}, 
        price = ${price}, 
        status = ${status ?? 'Active'}, 
        sku = ${sku}, 
        description = ${description}, 
        image_url = ${image_url}, 
        tags = ${tags},
        stock = ${stock},
        slug = ${slug},
        compare_price = ${comparePrice},
        cost_per_item = ${costPerItem},
        barcode = ${barcode},
        security_stock = ${securityStock},
        is_returnable = ${isReturnable},
        is_shippable = ${isShippable},
        brand_id = ${bId},
        variants = ${JSON.stringify(variants ?? [])},
        discount_price = ${discountPrice},
        discount_start = ${discountStart},
        discount_end = ${discountEnd}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    // Invalidate cache
    try { 
      await redis.del(CACHE_KEYS.PRODUCTS_LIST); 
      await redis.del(`${CACHE_KEYS.PRODUCTS_LIST}_PUBLIC`);
    } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error("PATCH error", error);
    return NextResponse.json({ success: false, error: "Update failure.", details: error.message }, { status: 400 });
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
    if (!await checkServerPermission("delete_products")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: "Missing id." }, { status: 400 });

    await sql`DELETE FROM products WHERE id = ${id}`;
    
    // Invalidate cache
    try { 
      await redis.del(CACHE_KEYS.PRODUCTS_LIST); 
      await redis.del(`${CACHE_KEYS.PRODUCTS_LIST}_PUBLIC`);
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Purged." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Purge failed.", details: error.message }, { status: 400 });
  }
}
