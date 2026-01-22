import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { getTeamsByEventId } from '@/services/teamService';
import { getScoresByEventId } from '@/services/scoreService';
import { getCertificateTemplates } from '@/services/certificateService';
import type { IndividualCertificateProps } from '@/components/certificates/IndividualCertificate';
import type { AggregatedScore } from '@/types';
import { checkApiAuth, authErrorResponse } from '@/lib/api-auth';

interface BulkGenerateRequest {
  eventId: string;
  teamId: string;
  participants: string[]; // Имена участников для генерации
}

// Генерация уникального номера сертификата
function generateCertificateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}${month}-${random}`;
}

// Получение текста достижения для места
function getAchievementText(place: number): string {
  switch (place) {
    case 1:
      return 'I место';
    case 2:
      return 'II место';
    case 3:
      return 'III место';
    default:
      return 'участие';
  }
}

// Расчет общего балла команды
function calculateTeamTotalScore(teamId: string, scores: AggregatedScore[]): number {
  const teamScores = scores.filter(s => s.teamId === teamId);
  return teamScores.reduce((sum, score) => sum + score.averageScore, 0);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    let body: BulkGenerateRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }
    
    // Валидация UUID форматов
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (body.eventId && !uuidRegex.test(body.eventId)) {
      return NextResponse.json(
        { error: 'Некорректный формат eventId' },
        { status: 400 }
      );
    }
    if (body.teamId && !uuidRegex.test(body.teamId)) {
      return NextResponse.json(
        { error: 'Некорректный формат teamId' },
        { status: 400 }
      );
    }
    
    // Санитизация имён участников (защита от path traversal в ZIP)
    if (body.participants) {
      body.participants = body.participants.map(name => 
        name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 100)
      );
    }
    
    // Проверка доступа к eventId для Jury
    if (authResult.session.role === 'Jury' && authResult.session.eventId !== body.eventId) {
      return NextResponse.json(
        { error: 'Доступ запрещён: вы не назначены на это мероприятие' },
        { status: 403 }
      );
    }
    const { eventId, teamId, participants } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId обязателен' },
        { status: 400 }
      );
    }

    if (!teamId || !participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать команду и участников' },
        { status: 400 }
      );
    }

    // Ограничение для Vercel Hobby Plan (10 секунд timeout)
    const MAX_CERTIFICATES_PER_REQUEST = 7;
    if (participants.length > MAX_CERTIFICATES_PER_REQUEST) {
      return NextResponse.json(
        { 
          error: `Максимум ${MAX_CERTIFICATES_PER_REQUEST} сертификатов за один запрос`,
          hint: 'Выберите меньше участников или разделите на несколько запросов'
        },
        { status: 400 }
      );
    }

    // Получаем данные
    const teams = await getTeamsByEventId(eventId);
    const scores = await getScoresByEventId(eventId);
    const templates = await getCertificateTemplates(eventId);

    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена' },
        { status: 404 }
      );
    }

    // Определяем место команды
    const teamTotals = teams.map(t => ({
      teamId: t.id,
      totalScore: calculateTeamTotalScore(t.id, scores)
    }));
    const sortedScores = teamTotals.sort((a, b) => b.totalScore - a.totalScore);
    const place = sortedScores.findIndex(s => s.teamId === teamId) + 1;

    // Создаем ZIP архив
    const zip = new JSZip();
    const { default: IndividualCertificate } = await import('@/components/certificates/IndividualCertificate');

    // Генерируем сертификат для каждого участника
    for (const participantName of participants) {
      const certificateData: IndividualCertificateProps = {
        participantName,
        teamName: team.name,
        achievement: getAchievementText(place),
        date: new Date().toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        eventName: templates.organizer.eventName,
        organizerName: templates.organizer.name,
        organizerTitle: templates.organizer.title,
        certificateNumber: generateCertificateNumber(),
      };

      // Генерируем PDF
      const pdfStream = await ReactPDF.renderToStream(
        React.createElement(IndividualCertificate, {
          ...certificateData,
          titleText: templates.pdf.individualTitle,
          introText: templates.pdf.individualIntro,
        }) as React.ReactElement<DocumentProps>
      );

      // Конвертируем stream в buffer
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfStream.on('end', () => resolve());
        pdfStream.on('error', (error: Error) => reject(error));
      });

      const pdfBuffer = Buffer.concat(chunks);
      
      // Добавляем в ZIP
      const fileName = `${participantName.replace(/\s+/g, '_')}.pdf`;
      zip.file(fileName, pdfBuffer);
    }

    // Генерируем ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="certificates-${team.name.replace(/\s+/g, '-')}.zip"`,
      },
    });

  } catch (error) {
    console.error('Ошибка при массовой генерации сертификатов:', error);
    return NextResponse.json(
      { error: 'Ошибка при генерации сертификатов', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
