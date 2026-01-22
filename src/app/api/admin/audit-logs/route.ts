/**
 * API Route: Audit Logs
 * 
 * Получение логов действий для администраторов
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth } from '@/lib/api-auth';
import { getAuditLogs, getAuditStats } from '@/services/auditLogService';
import type { AuditAction } from '@/types/audit-log';

// GET - получить логи
export async function GET(request: NextRequest) {
  const authResult = checkApiAuth(request, ['Admin']);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  
  const action = searchParams.get('action') as AuditAction | null;
  const userId = searchParams.get('userId');
  const eventId = searchParams.get('eventId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const stats = searchParams.get('stats') === 'true';

  try {
    if (stats) {
      // Возвращаем статистику
      const days = parseInt(searchParams.get('days') || '7');
      const auditStats = await getAuditStats(days);
      return NextResponse.json({ success: true, stats: auditStats });
    }

    // Возвращаем логи
    const result = await getAuditLogs({
      action: action || undefined,
      userId: userId || undefined,
      eventId: eventId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения логов' },
      { status: 500 }
    );
  }
}
