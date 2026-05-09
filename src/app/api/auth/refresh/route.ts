import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Token Rotation Nexus
 * Rotating Access Tokens using the long-lived Refresh Token credential.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('atelier_refresh_token')?.value;

    if (!refreshToken || !refreshToken.startsWith('rt_')) {
      return NextResponse.json({
        success: false,
        error: "Refresh credential missing or invalid."
      }, { status: 401 });
    }

    // Logic for new access token generation
    const newAccessToken = `at_refreshed_${Math.random().toString(36).substring(2)}_${Date.now()}`;

    // Rotating the Access Token cookie
    cookieStore.set('atelier_access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 Minutes
    });

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      message: "Access credential successfully rotated."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Token rotation service failure.",
    }, { status: 500 });
  }
}
