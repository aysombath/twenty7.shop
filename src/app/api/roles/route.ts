import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';

/**
 * Ensures the roles table exists.
 */
async function ensureRolesSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Seed default roles if empty
  const countRes = await sql`SELECT count(*) FROM roles`;
  if (countRes[0].count === '0') {
    await sql`
      INSERT INTO roles (name, description) VALUES
      ('Admin', 'Full administrative access to all system modules and configuration.'),
      ('Manager', 'Operational access to handle orders, products, and customer records.'),
      ('Client', 'Standard access for registered customers or end users.')
    `;
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
      return NextResponse.json({ success: false, error: "Access Denied: Invalid credentials." }, { status: 401 });
    }

    if (!await checkServerPermission("view_roles")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient for this role query." }, { status: 403 });
    }

    await ensureRolesSchema();

    const roles = await sql`SELECT * FROM roles ORDER BY id ASC`;

    return NextResponse.json({
      success: true,
      data: roles,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Role GET error:", error.message);
    return NextResponse.json({
      success: false,
      error: "Neon Database offline.",
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

    if (!await checkServerPermission("create_roles")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to mint role." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: "Role name is a required field."
      }, { status: 400 });
    }

    await ensureRolesSchema();

    const result = await sql`
      INSERT INTO roles (name, description)
      VALUES (${name}, ${description || null})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "New system role minted successfully."
    });
  } catch (error: any) {
    console.error("Role POST error:", error.message);
    const isDuplicate = error.message?.toLowerCase().includes('unique') || error.message?.toLowerCase().includes('duplicate');

    return NextResponse.json({
      success: false,
      error: isDuplicate
        ? "A role with this unique identifier already exists."
        : "Failed to construct system role.",
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

    if (!await checkServerPermission("edit_roles")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to update role." }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "Role ID and Name required." }, { status: 400 });
    }

    const result = await sql`
      UPDATE roles 
      SET name = ${name}, description = ${description || null}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "System role properties updated."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Role update failure.",
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

    if (!await checkServerPermission("delete_roles")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to delete role." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Missing identity reference." }, { status: 400 });

    // Protect default roles from deletion
    if (['1', '2', '3'].includes(id)) {
      return NextResponse.json({ success: false, error: "Cannot delete core system architectures." }, { status: 403 });
    }

    await sql`DELETE FROM roles WHERE id = ${id}`;

    return NextResponse.json({
      success: true,
      message: "Role definition purged from index."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Purge failure.",
      details: error.message
    }, { status: 400 });
  }
}
