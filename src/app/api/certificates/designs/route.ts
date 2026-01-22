/**
 * API Route: Certificate Designs
 * 
 * CRUD для шаблонов дизайна сертификатов
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth } from '@/lib/api-auth';
import { 
  getDesignTemplate, 
  saveDesignTemplate,
  deleteDesignTemplate,
} from '@/services/certificateDesignService';
import type { CertificateDesignTemplate } from '@/types/certificate-design';

// GET - получить шаблон по eventId
export async function GET(request: NextRequest) {
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager']);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'eventId обязателен' }, { status: 400 });
  }

  try {
    const template = await getDesignTemplate(eventId);
    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Get design error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки шаблона' }, { status: 500 });
  }
}

// POST - сохранить шаблон
export async function POST(request: NextRequest) {
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager']);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const template = body.template as CertificateDesignTemplate;

    if (!template || !template.eventId) {
      return NextResponse.json({ error: 'Некорректные данные шаблона' }, { status: 400 });
    }

    await saveDesignTemplate(template);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save design error:', error);
    return NextResponse.json({ error: 'Ошибка сохранения шаблона' }, { status: 500 });
  }
}

// DELETE - удалить шаблон
export async function DELETE(request: NextRequest) {
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager']);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'eventId обязателен' }, { status: 400 });
  }

  try {
    await deleteDesignTemplate(eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete design error:', error);
    return NextResponse.json({ error: 'Ошибка удаления шаблона' }, { status: 500 });
  }
}
