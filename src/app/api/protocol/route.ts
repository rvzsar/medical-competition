import { NextRequest, NextResponse } from 'next/server';
import { getScoreLog } from '@/utils/redisStorage';

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('jury_id');
  if (!authCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(500, Number(limitParam) || 100)) : 100;

  try {
    const log = await getScoreLog(limit);
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error loading score log:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при загрузке протокола оценок' },
      { status: 500 },
    );
  }
}
