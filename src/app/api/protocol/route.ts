/**
 * API Route: Protocol - протокол изменений оценок
 * 
 * Использует новую систему scoreService
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScoreLog } from '@/services/scoreService';
import { checkApiAuth, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(500, Number(limitParam) || 100)) : 100;

  try {
    let log = await getScoreLog(limit);
    
    // Фильтрация по eventId для Jury и Event_Manager (не Admin)
    if (authResult.session && authResult.session.role !== 'Admin' && authResult.session.eventId) {
      log = log.filter(entry => entry.eventId === authResult.session!.eventId);
    }
    
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error loading score log:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при загрузке протокола оценок' },
      { status: 500 },
    );
  }
}
