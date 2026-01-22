import { NextRequest, NextResponse } from 'next/server';
import { getTeamsByEventId } from '@/services/teamService';
import { getScoresByEventId } from '@/services/scoreService';
import { getCertificateTemplates } from '@/services/certificateService';
import { checkApiAuth, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId обязателен' },
        { status: 400 }
      );
    }
    
    // Валидация UUID формата
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат eventId' },
        { status: 400 }
      );
    }
    
    // Проверка доступа к eventId для Jury
    if (authResult.session.role === 'Jury' && authResult.session.eventId !== eventId) {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    const teams = await getTeamsByEventId(eventId);
    const scores = await getScoresByEventId(eventId);
    const templates = await getCertificateTemplates(eventId);

    const envCheck = {
      redis: !!process.env.REDIS_URL,
      emailUser: !!process.env.EMAIL_USER,
      emailPass: !!process.env.EMAIL_PASS,
      emailFrom: !!process.env.EMAIL_FROM,
      sessionSecret: !!process.env.SESSION_SECRET,
      csrfSecret: !!process.env.CSRF_SECRET,
    };

    return NextResponse.json({
      success: true,
      message: 'API сертификатов работает корректно',
      data: {
        eventId,
        teamsCount: teams.length,
        scoresCount: scores.length,
        templatesConfigured: !!templates.organizer.eventName,
        environmentVariables: envCheck,
      },
      templates: {
        eventName: templates.organizer.eventName,
        organizerName: templates.organizer.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка при проверке системы',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
