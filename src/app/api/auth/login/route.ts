import { NextRequest, NextResponse } from 'next/server';
import { JURY_MEMBERS } from '@/config/juryMembers';

export async function POST(request: NextRequest) {
  try {
    const { juryId } = await request.json();

    if (!juryId || typeof juryId !== 'string') {
      return NextResponse.json({ error: 'juryId is required' }, { status: 400 });
    }

    const jury = JURY_MEMBERS.find((j) => j.id === juryId);
    if (!jury) {
      return NextResponse.json({ error: 'Invalid juryId' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set('jury_id', jury.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
