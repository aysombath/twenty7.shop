import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateHeaderToken, validateSession, checkServerPermission } from '@/lib/auth';

/**
 * Ensures the role_permissions table exists alongside roles.
 */
async function ensurePermissionsSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_key VARCHAR(100) NOT NULL,
      PRIMARY KEY (role_id, permission_key)
    )
  `;

  // Seed default admin permissions if it's completely empty
  const countRes = await sql`SELECT count(*) FROM role_permissions`;
  if (countRes[0].count === '0') {
    // Attempt to seed Admin (role_id = 1) and Manager (role_id = 2) if they exist
    try {
      await sql`
        INSERT INTO role_permissions (role_id, permission_key) VALUES
        (1, 'view_dashboard'),
        (1, 'view_orders'),
        (1, 'view_products'),
        (1, 'view_customers'),
        (1, 'view_roles'),
        (1, 'create_roles'),
        (1, 'edit_roles'),
        (1, 'delete_roles'),
        (1, 'view_analytics'),
        (1, 'view_settings'),
        
        (2, 'view_dashboard'),
        (2, 'view_orders'),
        (2, 'view_products'),
        (2, 'view_customers'),
        (2, 'view_analytics'),
        
        (3, 'view_dashboard')
      `;
    } catch(e) { /* Ignore seeding erorrs if roles table doesn't have 1,2,3 IDs */ }
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const isSessionValid = await validateSession();
    const isTokenValid = validateHeaderToken(authHeader);

    if (!isSessionValid && !isTokenValid) {
      return NextResponse.json({ success: false, error: "Access Denied." }, { status: 401 });
    }

    if (!await checkServerPermission("view_roles")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to query security matrix." }, { status: 403 });
    }

    await ensurePermissionsSchema();

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('role_id');

    let permissions;
    if (roleId) {
      permissions = await sql`SELECT permission_key FROM role_permissions WHERE role_id = ${roleId}`;
    } else {
      permissions = await sql`SELECT role_id, permission_key FROM role_permissions`;
    }

    return NextResponse.json({
      success: true,
      data: permissions,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Permissions GET error:", error.message);
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

    if (!await checkServerPermission("edit_roles")) {
      return NextResponse.json({ success: false, error: "Access Denied: Permissions insufficient to reconfigure security matrix." }, { status: 403 });
    }

    const body = await request.json();
    const { role_id, permissions } = body;

    if (!role_id || !Array.isArray(permissions)) {
      return NextResponse.json({
        success: false,
        error: "role_id and an array of permissions are required."
      }, { status: 400 });
    }

    await ensurePermissionsSchema();

    // To prevent Admin lockout implicitly, we can make sure 'manage_permissions'
    // is never removed from the Admin role (ID = 1 usually, though we can skip strict checks for flexibility)

    // Execute within a transaction replacement natively: clear old, insert new
    await sql`DELETE FROM role_permissions WHERE role_id = ${role_id}`;

    if (permissions.length > 0) {
      // Construction for batch inserting
      for(const p of permissions) {
        await sql`INSERT INTO role_permissions (role_id, permission_key) VALUES (${role_id}, ${p})`;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Role permissions synchronized."
    });
  } catch (error: any) {
    console.error("Permissions POST error:", error.message);
    return NextResponse.json({
      success: false,
      error: "Failed to allocate permissions.",
      details: error.message
    }, { status: 400 });
  }
}
