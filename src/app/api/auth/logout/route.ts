import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Precision Atelier — Session Termination API
 * Clears all authentication tokens and cookies securely.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('atelier_access_token');
    cookieStore.delete('atelier_refresh_token');
    cookieStore.delete('atelier_session');
    cookieStore.delete('atelier_user_identity');

    return NextResponse.json({
      success: true,
      message: "Credential clearing complete. Session terminated."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Logout failure.",
    }, { status: 500 });
  }
}
