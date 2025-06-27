import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Get Clerk auth info
    const clerkAuth = await auth();
    
    // Get database user
    const dbUser = await getCurrentUser();
    
    return NextResponse.json({
      clerk: {
        userId: clerkAuth.userId,
        sessionId: clerkAuth.sessionId,
        orgId: clerkAuth.orgId,
      },
      database: {
        user: dbUser,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { error: 'Failed to get auth debug info', details: error },
      { status: 500 }
    );
  }
}