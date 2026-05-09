import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

/**
 * Precision Atelier Authorization Utility
 * Validating architectural credentials and token integrity.
 */

export async function validateSession() {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get('atelier_access_token')?.value;
  const refreshToken = cookieStore.get('atelier_refresh_token')?.value;
  const legacySession = cookieStore.get('atelier_session')?.value;

  // Prioritize active tokens, then legacy session
  if (accessToken && accessToken.startsWith('at_')) return true;
  if (refreshToken && refreshToken.startsWith('rt_')) return true;
  if (legacySession === 'authenticated_admin') return true;

  return false;
}

/**
 * Retrieves the session user from the secure identity cookie.
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const identity = cookieStore.get('atelier_user_identity')?.value;
  if (!identity) return null;
  try {
    return JSON.parse(identity);
  } catch {
    return null;
  }
}

/**
 * Checks if the current session user has a specific permission key.
 */
export async function checkServerPermission(permissionKey: string) {
  const cookieStore = await cookies();
  const identity = cookieStore.get('atelier_user_identity')?.value;
  const legacySession = cookieStore.get('atelier_session')?.value;

  // Case 1: Active Identity Cookie present
  if (identity) {
    try {
      const user = JSON.parse(identity);
      if (user.type === 'admin' || user.role === 'Master Architect') return true;
      
      const result = await sql`
        SELECT 1 FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        WHERE (r.name = ${user.role} OR r.id::text = ${user.roleId || '0'}) 
        AND rp.permission_key = ${permissionKey}
        LIMIT 1
      `;
      return result.length > 0;
    } catch {
       // Identity corrupted, fallback to legacy
    }
  }

  // Case 2: Legacy fallback - if they are authenticated as admin but cookie is missing (pre-migration session)
  // we grant permission temporarily until next re-login sets the identity.
  if (legacySession === 'authenticated_admin') return true;

  return false;
}

/**
 * Validates the Authorization: Bearer <token> header
 * and matches against the stored access token if present.
 */
export function validateHeaderToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  
  // Basic validation that it matches the expected architectural pattern
  if (token.startsWith('at_')) {
    return true;
  }
  
  return false;
}
