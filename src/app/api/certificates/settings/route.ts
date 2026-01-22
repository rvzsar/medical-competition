import { NextRequest, NextResponse } from 'next/server';
import { getCertificateTemplates, saveCertificateTemplates } from '@/services/certificateService';
import { CertificateTemplatesConfig } from '@/types/certificate';
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
        { status: 400 },
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

    const templates = await getCertificateTemplates(eventId);
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('Ошибка при загрузке шаблонов сертификатов:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка при загрузке шаблонов сертификатов',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Только Admin и Event_Manager могут изменять настройки
    const authResult = checkApiAuth(request, ['Admin', 'Event_Manager']);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    let body: { eventId?: string; templates?: CertificateTemplatesConfig };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || !body.templates || !body.eventId) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат данных (требуется eventId и templates)' },
        { status: 400 },
      );
    }
    
    // Валидация UUID формата eventId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.eventId)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат eventId' },
        { status: 400 }
      );
    }

    const templates = body.templates as CertificateTemplatesConfig;
    const saved = await saveCertificateTemplates(body.eventId, templates);

    return NextResponse.json({ success: true, templates: saved });
  } catch (error) {
    console.error('Ошибка при сохранении шаблонов сертификатов:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка при сохранении шаблонов сертификатов',
      },
      { status: 500 },
    );
  }
}
