import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';
import { redis, CACHE_KEYS } from '@/lib/redis';

async function ensureTable() {
  try {
    // 1. Create base table (minimal guaranteed columns)
    await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)`;
    
    // 2. Safely evolve schema one by one (Isolated steps)
    try { await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`; } catch (e) {}
    try { await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER`; } catch (e) {}
    
    // Attempt to force type change if it was UUID; ignore if data conversion is impossible
    try { await sql`ALTER TABLE categories ALTER COLUMN parent_id SET DATA TYPE INTEGER USING parent_id::INTEGER`; } catch (e) {}
    
    try { await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT`; } catch (e) {}
    try { await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS visibility BOOLEAN DEFAULT TRUE`; } catch (e) {}
    try { await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`; } catch (e) {}
    try { await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`; } catch (e) {}
    
    // 3. Drop conflicting legacy constraints (Isolated steps)
    try { await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey`; } catch (e) {}
    try { await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_parent`; } catch (e) {}
    try { await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_fk`; } catch (e) {}
    
    // 4. Re-establish the correct modern link
    try { 
      await sql`ALTER TABLE categories ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES parent_categories(id) ON DELETE SET NULL`; 
    } catch (e) {
      // If adding fails, try one more time by dropping everything first
      try {
        await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_parent`;
        await sql`ALTER TABLE categories ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES parent_categories(id) ON DELETE SET NULL`;
      } catch (inner) {}
    }
  } catch (error: any) {
    console.warn("Category migration partial failure:", error.message);
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);
    const isAdmin = isSessionValid || isTokenValid;

    // Attempt cache retrieval — Precision Atelier Latency Management
    try {
      const cacheKey = isAdmin ? CACHE_KEYS.CATEGORIES_LIST : `${CACHE_KEYS.CATEGORIES_LIST}_PUBLIC`;
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          cache: "HIT",
          timestamp: new Date().toISOString(),
          base: "Precision Atelier - Taxonomy Registry"
        });
      }
    } catch (redisError) {
      console.warn("Redis Cache Access Failure:", redisError);
    }

    await ensureTable();

    // Fetching categories - MISS: Query master database
    try {
       const categories = isAdmin 
         ? await sql`
           SELECT c.id, c.name, c.slug, c.description, c.visibility, c.parent_id,
           COALESCE(c.created_at, NOW()) as created_at, COALESCE(c.updated_at, NOW()) as updated_at,
           p.name as parent_name 
           FROM categories c
           LEFT JOIN parent_categories p ON c.parent_id = p.id
           ORDER BY c.id DESC
         `
         : await sql`
           SELECT c.id, c.name, c.slug, c.description, c.visibility, c.parent_id,
           COALESCE(c.created_at, NOW()) as created_at, COALESCE(c.updated_at, NOW()) as updated_at,
           p.name as parent_name 
           FROM categories c
           LEFT JOIN parent_categories p ON c.parent_id = p.id
           WHERE c.visibility = TRUE
           ORDER BY c.id DESC
         `;

       // Update Cache for subsequent requests (1 hour TTL)
       try {
         const cacheKey = isAdmin ? CACHE_KEYS.CATEGORIES_LIST : `${CACHE_KEYS.CATEGORIES_LIST}_PUBLIC`;
         await redis.set(cacheKey, categories, { ex: 3600 });
       } catch (setCacheError) {
         console.warn("Cache Refresh Failure:", setCacheError);
       }

       return NextResponse.json({
         success: true,
         data: categories,
         cache: "MISS",
         total: categories.length,
         base: "Precision Atelier - Taxonomy Registry"
       });
    } catch (selectError: any) {
       console.error("Critical SELECT Failure:", selectError.message);
       const basicCategories = await sql`SELECT id, name, slug, description, visibility FROM categories ORDER BY id DESC`;
       return NextResponse.json({ success: true, data: basicCategories, total: basicCategories.length });
    }
  } catch (error: any) {
    console.error("GET Categories Internal Failure:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });

    if (!await checkServerPermission("create_categories")) {
      return NextResponse.json({ success: false, error: "Access Denied." }, { status: 403 });
    }

    await ensureTable();

    const body = await request.json();
    const { name, slug, description, visibility } = body;
    
    let parent_id = null;
    if (body.parent_id && body.parent_id !== "null" && body.parent_id !== "") {
       const parsedParentId = parseInt(body.parent_id.toString());
       if (!isNaN(parsedParentId)) parent_id = parsedParentId;
    }

    const result = await sql`
      INSERT INTO categories (name, slug, parent_id, description, visibility)
      VALUES (${name}, ${slug || null}, ${parent_id}, ${description || null}, ${visibility ?? true})
      RETURNING id, name, slug, description, visibility, created_at, updated_at
    `;

    // Cache Invalidation — Precision Atelier Consistency Enforcement
    try { await redis.del(CACHE_KEYS.CATEGORIES_LIST); } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
     console.error("POST Category Failure:", error.message);
     return NextResponse.json({ success: false, error: `Database Error: ${error.message}` }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  let body: any = {};
  let numericId: number = NaN;

  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });

    if (!await checkServerPermission("edit_categories")) {
      return NextResponse.json({ success: false, error: "Access Denied." }, { status: 403 });
    }

    await ensureTable();

    body = await request.json();
    const id = body.id;
    const name = body.name || '';
    const slug = body.slug || '';
    const description = body.description || '';
    const visibility = body.visibility ?? true;
    
    if (!id) return NextResponse.json({ success: false, error: 'Category identity is required for updates.' }, { status: 400 });

    // Explicit numeric conversion for id
    numericId = parseInt(id.toString());
    if (isNaN(numericId)) return NextResponse.json({ success: false, error: `Invalid identifier format: ${id}` }, { status: 400 });

    // Explicit numeric conversion for parent_id
    let parent_id = null;
    if (body.parent_id && body.parent_id !== "null" && body.parent_id !== "") {
       const parsedParentId = parseInt(body.parent_id.toString());
       if (!isNaN(parsedParentId)) parent_id = parsedParentId;
    }

    const result = await sql`
      UPDATE categories 
      SET 
        name = ${String(name || '')}, 
        slug = ${String(slug || '') || null}, 
        parent_id = ${parent_id}, 
        description = ${String(description || '') || null}, 
        visibility = ${Boolean(visibility ?? true)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${numericId}
      RETURNING *
    `;

    if (result.length === 0) return NextResponse.json({ success: false, error: "Category not found in vault." }, { status: 404 });

    // Cache Invalidation — Precision Atelier Consistency Enforcement
    try { await redis.del(CACHE_KEYS.CATEGORIES_LIST); } catch (e) {}

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
     console.error("PATCH Category Failure:", error);
     return NextResponse.json({ 
       success: false, 
       error: `Database Error: ${error.message}`,
       debug: { body_snapshot: body, parsed_id: numericId }
     }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isSessionValid = await validateSession();
    if (!isSessionValid) return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });

    if (!await checkServerPermission("delete_categories")) {
      return NextResponse.json({ success: false, error: "Access Denied." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: "Missing identity reference." }, { status: 400 });

    await sql`DELETE FROM categories WHERE id = ${id}`;

    // Cache Invalidation — Precision Atelier Consistency Enforcement
    try { await redis.del(CACHE_KEYS.CATEGORIES_LIST); } catch (e) {}

    return NextResponse.json({ success: true, message: "Asset purged from taxonomy vault." });
  } catch (error: any) {
     console.error("DELETE Category Failure:", error);
     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
