import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { getTeams, getAggregatedScores, getCertificateTemplates } from '@/utils/redisStorage';
import type { IndividualCertificateProps } from '@/components/certificates/IndividualCertificate';

interface BulkGenerateRequest {
  teamId: string;
  participants: string[]; // Имена участников для генерации
}

// Генерация уникального номера сертификата
function generateCertificateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `OG-${year}${month}-${random}`;
}

// Получение текста достижения для места
function getAchievementText(place: number): string {
  switch (place) {
    case 1:
      return 'Демонстрация выдающихся знаний и практических навыков';
    case 2:
      return 'Высокий уровень профессиональной подготовки';
    case 3:
      return 'Отличное владение теоретическими и практическими навыками';
    default:
      return 'Активное участие и профессиональный подход';
  }
}

// Функция для расчета общего балла команды
function calculateTotalScore(teamId: string, allScores: any[]): number {
  const teamScores = allScores.filter(s => s.teamId === teamId);
  return teamScores.reduce((sum, score) => sum + score.averageScore, 0);
}

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkGenerateRequest = await request.json();
    const { teamId, participants } = body;

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
    const teams = await getTeams();
    const scores = await getAggregatedScores();
    const templates = await getCertificateTemplates();

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
      totalScore: calculateTotalScore(t.id, scores)
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
