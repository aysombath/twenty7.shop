import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

/**
 * Enhanced Authentication Nexus API
 * implementing Access and Refresh Token orchestration.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@precision.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'precision2026';
    const ADMIN_ROLE = process.env.ADMIN_ROLE || 'Master Architect';

    let userAccount = null;

    // 1. Initial Retrieval: Attempting Admin Identification
    if ((username === ADMIN_USERNAME || username === ADMIN_EMAIL) && password === ADMIN_PASSWORD) {
      userAccount = {
        username: ADMIN_USERNAME,
        role: ADMIN_ROLE,
        type: 'admin'
      };
    } else {
      // 2. Secondary Retrieval: Probing the Neon Relationship Vault for valid Customer credentials
      try {
        const query = await sql`
          SELECT * FROM customers 
          WHERE (username = ${username} OR email = ${username}) 
          AND password = ${password} 
          LIMIT 1
        `;
        
        if (query.length > 0) {
          userAccount = {
            username: query[0].username || query[0].email,
            name: query[0].name,
            role: 'Client',
            type: 'customer',
            id: query[0].id
          };
        }
      } catch (dbError) {
        console.error("Identity retrieval interrupted during customer probe.", dbError);
      }
    }

    if (userAccount) {
      // Logic for generation (Simulating JWT / unique identifiers)
      const accessToken = `at_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      const refreshToken = `rt_${Math.random().toString(36).substring(2)}_${Date.now()}`;

      const cookieStore = await cookies();
      
      // Access Token: Short-lived secure session passage
      cookieStore.set('atelier_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 // 15 Minutes
      });

      // Refresh Token: Long-lived archival credentials
      cookieStore.set('atelier_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 Days
      });

      // Backwards compatibility legacy session (internal sentinel)
      cookieStore.set('atelier_session', 'authenticated_admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });

      // Secure Identity encoding for Backend RBAC
      cookieStore.set('atelier_user_identity', JSON.stringify(userAccount), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });

      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken,
        message: `Welcome, ${userAccount.username}. Access granted to the Precision Atelier Vault.`,
        user: userAccount
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid architectural credentials."
    }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Authentication service transient failure.",
    }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('atelier_access_token');
  cookieStore.delete('atelier_refresh_token');
  cookieStore.delete('atelier_session');
  return NextResponse.json({ success: true, message: "Credential clearing complete. Session terminated." });
}
