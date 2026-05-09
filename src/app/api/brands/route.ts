import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';
import { redis, CACHE_KEYS } from '@/lib/redis';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
       return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });
    }

    if (!await checkServerPermission("view_brands")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient for brand registry." }, { status: 403 });
    }

    // Cache lookup
    try {
      const cached = await redis.get(CACHE_KEYS.BRANDS_LIST);
      if (cached) return NextResponse.json({ success: true, data: cached, cache: "HIT" });
    } catch (e) {}

    // Initialize Database architecture for Brands
    await sql`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        website TEXT NOT NULL,
        description TEXT,
        visibility BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const brands = await sql`SELECT * FROM brands ORDER BY created_at DESC`;

    // Save to cache
    try { await redis.set(CACHE_KEYS.BRANDS_LIST, brands, { ex: 3600 }); } catch (e) {}

    return NextResponse.json({
      success: true,
      data: brands,
      cache: "MISS",
      base: "Precision Atelier - Brand Intelligence"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });

    if (!await checkServerPermission("create_brands")) {
      return NextResponse.json({ success: false, error: "Access Denied: Insufficient Role." }, { status: 403 });
    }

    const { name, slug, website, description, visibility } = await request.json();

    const result = await sql`
      INSERT INTO brands (name, slug, website, description, visibility)
      VALUES (${name}, ${slug}, ${website}, ${description}, ${visibility})
      RETURNING *
    `;

    // Invalidate cache
    try { await redis.del(CACHE_KEYS.BRANDS_LIST); } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });

    if (!await checkServerPermission("edit_brands")) {
      return NextResponse.json({ success: false, error: "Insufficient Role." }, { status: 403 });
    }

    const { id, name, slug, website, description, visibility } = await request.json();

    const result = await sql`
      UPDATE brands 
      SET 
        name = ${name}, 
        slug = ${slug}, 
        website = ${website}, 
        description = ${description}, 
        visibility = ${visibility},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) return NextResponse.json({ success: false, error: "Brand not found." }, { status: 404 });

    // Invalidate cache
    try { await redis.del(CACHE_KEYS.BRANDS_LIST); } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });

    if (!await checkServerPermission("delete_brands")) {
      return NextResponse.json({ success: false, error: "Insufficient Role." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: "Missing ID." }, { status: 400 });

    await sql`DELETE FROM brands WHERE id = ${id}`;

    // Invalidate cache
    try { await redis.del(CACHE_KEYS.BRANDS_LIST); } catch (e) {}

    return NextResponse.json({ success: true, message: "Brand identity purged." });
  } catch (error: any) {
     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
