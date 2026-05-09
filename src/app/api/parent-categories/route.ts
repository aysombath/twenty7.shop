import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';
import { redis, CACHE_KEYS } from '@/lib/redis';

async function ensureTable() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS parent_categories (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)`;
    try { await sql`ALTER TABLE parent_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`; } catch (e) {}
    try { await sql`ALTER TABLE parent_categories ADD COLUMN IF NOT EXISTS description TEXT`; } catch (e) {}
    try { await sql`ALTER TABLE parent_categories ADD COLUMN IF NOT EXISTS visibility BOOLEAN DEFAULT TRUE`; } catch (e) {}
    try { await sql`ALTER TABLE parent_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`; } catch (e) {}
    try { await sql`ALTER TABLE parent_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`; } catch (e) {}
  } catch (e) {}
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);
    if (!isSessionValid && !isTokenValid) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 401 });
    if (!await checkServerPermission('view_categories')) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 403 });

    // Cache lookup
    try {
      const cached = await redis.get(CACHE_KEYS.PARENT_CATEGORIES_LIST);
      if (cached) return NextResponse.json({ success: true, data: cached, cache: 'HIT' });
    } catch (e) {}

    await ensureTable();

    const rows = await sql`SELECT id, name, slug, description, visibility, COALESCE(created_at, NOW()) as created_at, COALESCE(updated_at, NOW()) as updated_at FROM parent_categories ORDER BY id DESC`;
    
    // Save to cache
    try { await redis.set(CACHE_KEYS.PARENT_CATEGORIES_LIST, rows, { ex: 3600 }); } catch (e) {}

    return NextResponse.json({ success: true, data: rows, total: rows.length, cache: 'MISS' });
  } catch (error: any) {
    console.error('GET ParentCategories error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 401 });
    if (!await checkServerPermission('create_categories')) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 403 });

    await ensureTable();

    const { name, slug, description, visibility } = await request.json();
    const result = await sql`
      INSERT INTO parent_categories (name, slug, description, visibility)
      VALUES (${name}, ${slug || null}, ${description || null}, ${visibility ?? true})
      RETURNING id, name, slug, description, visibility, created_at, updated_at
    `;
    
    // Invalidate cache
    try { await redis.del(CACHE_KEYS.PARENT_CATEGORIES_LIST); } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error('POST ParentCategories error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 401 });
    if (!await checkServerPermission('edit_categories')) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 403 });

    const { id, name, slug, description, visibility } = await request.json();
    const result = await sql`
      UPDATE parent_categories SET name=${name}, slug=${slug||null}, description=${description||null}, visibility=${visibility}, updated_at=CURRENT_TIMESTAMP
      WHERE id=${id} RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 });
    
    // Invalidate cache
    try { await redis.del(CACHE_KEYS.PARENT_CATEGORIES_LIST); } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error('PATCH ParentCategories error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 401 });
    if (!await checkServerPermission('delete_categories')) return NextResponse.json({ success: false, error: 'Access Denied.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id.' }, { status: 400 });

    await sql`DELETE FROM parent_categories WHERE id=${id}`;
    
    // Invalidate cache
    try { await redis.del(CACHE_KEYS.PARENT_CATEGORIES_LIST); } catch (e) {}

    return NextResponse.json({ success: true, message: 'Deleted.' });
  } catch (error: any) {
    console.error('DELETE ParentCategories error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
