import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { render } from '@react-email/components';
import CertificateEmail from '@/emails/CertificateEmail';
import { getAggregatedScores, getTeams } from '@/utils/redisStorage';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendCertificateRequest {
  type: 'team' | 'individual';
  teamId?: string;
  participantName?: string;
  participantEmail: string;
  specialAward?: string;
}

interface SendBulkRequest {
  recipients: Array<{
    type: 'team' | 'individual';
    teamId: string;
    participantName?: string;
    participantEmail: string;
    specialAward?: string;
  }>;
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

// Генерация PDF сертификата
async function generateCertificatePDF(
  type: 'team' | 'individual',
  certificateData: any
): Promise<Buffer> {
  if (type === 'team') {
    const { default: TeamCertificate } = await import('@/components/certificates/TeamCertificate');
    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(TeamCertificate, certificateData) as any
    );

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
  } else {
    const { default: IndividualCertificate } = await import('@/components/certificates/IndividualCertificate');
    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(IndividualCertificate, certificateData) as any
    );

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
  }
}

// Отправка одного сертификата
async function sendSingleCertificate(request: SendCertificateRequest) {
  const { type, teamId, participantName, participantEmail, specialAward } = request;

  if (!teamId) {
    throw new Error('teamId обязателен');
  }

  // Получаем данные
  const teams = await getTeams();
  const scores = await getAggregatedScores();

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    throw new Error('Команда не найдена');
  }

  // Рассчитываем место команды
  const teamTotals = teams.map(t => ({
    teamId: t.id,
    totalScore: calculateTotalScore(t.id, scores)
  }));
  const sortedScores = teamTotals.sort((a, b) => b.totalScore - a.totalScore);
  const place = sortedScores.findIndex(s => s.teamId === teamId) + 1;
  const totalScore = teamTotals.find(t => t.teamId === teamId)?.totalScore || 0;

  // Данные сертификата
  const certificateData = {
    ...(type === 'team'
      ? {
          teamName: team.name,
          place: place <= 3 ? place : 0,
          score: totalScore,
        }
      : {
          participantName: participantName || '',
          teamName: team.name,
          achievement: getAchievementText(place),
          specialAward,
        }),
    date: new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    eventName: 'Олимпиада по акушерству и гинекологии',
    organizerName: 'Кафедра акушерства и гинекологии',
    organizerTitle: 'Заведующий кафедрой',
    certificateNumber: generateCertificateNumber(),
  };

  // Генерируем PDF
  const pdfBuffer = await generateCertificatePDF(type, certificateData);

  // Генерируем HTML email
  const emailHtml = await render(
    React.createElement(CertificateEmail, {
      recipientName: type === 'team' ? team.name : participantName || '',
      certificateType: type,
      teamName: team.name,
      place: place <= 3 ? place : undefined,
      score: type === 'team' ? totalScore : undefined,
      eventName: 'Олимпиада по акушерству и гинекологии',
    })
  );

  // Отправляем email через Resend
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    to: participantEmail,
    subject: `Сертификат участника - Олимпиада по акушерству и гинекологии`,
    html: emailHtml,
    attachments: [
      {
        filename: `certificate-${type === 'team' ? team.name : participantName}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  return result;
}

// POST: Отправка сертификата одному получателю
export async function POST(request: NextRequest) {
  try {
    const body: SendCertificateRequest = await request.json();
    
    if (!body.participantEmail) {
      return NextResponse.json(
        { error: 'Email получателя обязателен' },
        { status: 400 }
      );
    }

    const result = await sendSingleCertificate(body);

    return NextResponse.json({
      success: true,
      message: 'Сертификат успешно отправлен',
      emailId: result.data?.id,
    });

  } catch (error) {
    console.error('Ошибка при отправке сертификата:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при отправке сертификата', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT: Массовая отправка сертификатов
export async function PUT(request: NextRequest) {
  try {
    const body: SendBulkRequest = await request.json();
    
    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'Список получателей обязателен' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Отправляем сертификаты последовательно
    for (const recipient of body.recipients) {
      try {
        const result = await sendSingleCertificate(recipient);
        results.push({
          email: recipient.participantEmail,
          success: true,
          emailId: result.data?.id,
        });
      } catch (error) {
        errors.push({
          email: recipient.participantEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Отправлено ${results.length} из ${body.recipients.length} сертификатов`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Ошибка при массовой отправке сертификатов:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при массовой отправке сертификатов', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}