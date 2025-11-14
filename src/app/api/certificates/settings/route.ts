import { NextRequest, NextResponse } from 'next/server';
import { getCertificateTemplates, saveCertificateTemplates } from '@/utils/redisStorage';
import { CertificateTemplatesConfig } from '@/types/certificate';

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const templates = await getCertificateTemplates();
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
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();

    if (!body || typeof body !== 'object' || !body.templates) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат данных' },
        { status: 400 },
      );
    }

    const templates = body.templates as CertificateTemplatesConfig;
    const saved = await saveCertificateTemplates(templates);

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
