import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import CertificateEmail from '@/emails/CertificateEmail';
import { AggregatedScore } from '@/types';
import type { TeamCertificateProps } from '@/components/certificates/TeamCertificate';
import type { IndividualCertificateProps } from '@/components/certificates/IndividualCertificate';
import { getTeamsByEventId } from '@/services/teamService';
import { getScoresByEventId } from '@/services/scoreService';
import { getCertificateTemplates } from '@/services/certificateService';
import { getDesignTemplate } from '@/services/certificateDesignService';
import { generatePdfFromDesign, generateCertificateNumber as generateDesignCertNumber, type CertificateData } from '@/services/certificatePdfFromDesign';
import { checkApiAuth, authErrorResponse } from '@/lib/api-auth';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

interface SendCertificateRequest {
  type: 'team' | 'individual';
  eventId: string;
  teamId?: string;
  participantName?: string;
  participantEmail: string;
  specialAward?: string;
  useCustomDesign?: boolean; // Использовать кастомный дизайн
}

interface SendBulkRequest {
  eventId: string;
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
function calculateTotalScore(teamId: string, allScores: AggregatedScore[]): number {
  const teamScores = allScores.filter(s => s.teamId === teamId);
  return teamScores.reduce((sum, score) => sum + score.averageScore, 0);
}

// Генерация PDF сертификата
async function generateCertificatePDF(
  type: 'team',
  certificateData: TeamCertificateProps,
): Promise<Buffer>;
async function generateCertificatePDF(
  type: 'individual',
  certificateData: IndividualCertificateProps,
): Promise<Buffer>;
async function generateCertificatePDF(
  type: 'team' | 'individual',
  certificateData: TeamCertificateProps | IndividualCertificateProps,
  eventId: string,
): Promise<Buffer> {
  const templates = await getCertificateTemplates(eventId);

  if (type === 'team') {
    const { default: TeamCertificate } = await import('@/components/certificates/TeamCertificate');
    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(TeamCertificate, {
        ...(certificateData as TeamCertificateProps),
        titleText: templates.pdf.teamTitle,
        introText: templates.pdf.teamIntro,
      }) as React.ReactElement<DocumentProps>
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
      React.createElement(IndividualCertificate, {
        ...(certificateData as IndividualCertificateProps),
        titleText: templates.pdf.individualTitle,
        introText: templates.pdf.individualIntro,
      }) as React.ReactElement<DocumentProps>
    );

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
  }
}

function applyTemplate(template: string, context: Record<string, string | number | null | undefined>): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    const value = context[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

async function sendCertificateEmail(options: {
  to: string;
  html: string;
  pdfBuffer: Buffer;
  filename: string;
  subject?: string;
}) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!from) {
    throw new Error('EMAIL_FROM or EMAIL_USER must be configured');
  }

  // Retry logic: 3 попытки с exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject || 'Сертификат участника - Олимпиада по акушерству и гинекологии',
        html: options.html,
        attachments: [
          {
            filename: options.filename,
            content: options.pdfBuffer,
          },
        ],
      });

      const smtpInfo = {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      };

      console.log('SMTP result:', smtpInfo);

      if (!info.accepted || info.accepted.length === 0) {
        throw new Error('SMTP send failed: no recipients accepted');
      }

      return smtpInfo;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('SMTP error');
      console.error(`SMTP send error (attempt ${attempt}/${maxRetries}):`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`SMTP send failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// Отправка одного сертификата
async function sendSingleCertificate(request: SendCertificateRequest) {
  const { type, eventId, teamId, participantName, participantEmail, specialAward, useCustomDesign } = request;

  if (!eventId) {
    throw new Error('eventId обязателен');
  }

  if (!teamId) {
    throw new Error('teamId обязателен');
  }

  // Получаем данные
  const teams = await getTeamsByEventId(eventId);
  const scores = await getScoresByEventId(eventId);

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

  const templates = await getCertificateTemplates(eventId);
  
  // Проверяем наличие кастомного дизайна
  const customDesign = useCustomDesign ? await getDesignTemplate(eventId) : null;

  let pdfBuffer: Buffer;
  
  if (customDesign) {
    // Генерируем PDF из кастомного дизайна
    const designData: CertificateData = {
      recipientName: type === 'individual' && participantName ? participantName : team.name,
      teamName: team.name,
      eventName: templates.organizer.eventName,
      date: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      place: place <= 3 ? place : undefined,
      score: totalScore ? totalScore.toFixed(2) : undefined,
      certificateNumber: generateDesignCertNumber(),
      organizerName: templates.organizer.name,
      organizerTitle: templates.organizer.title,
    };
    
    pdfBuffer = await generatePdfFromDesign(customDesign, designData);
  } else {
    // Используем стандартные шаблоны
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
      eventName: templates.organizer.eventName,
      organizerName: templates.organizer.name,
      organizerTitle: templates.organizer.title,
      certificateNumber: generateCertificateNumber(),
    };

    pdfBuffer =
      type === 'team'
        ? await generateCertificatePDF('team', certificateData as TeamCertificateProps, eventId)
        : await generateCertificatePDF('individual', certificateData as IndividualCertificateProps, eventId);
  }

  const eventName = templates.organizer.eventName;
  const organizerName = templates.organizer.name;
  const organizerTitle = templates.organizer.title;

  const context = {
    recipientName: type === 'team' ? team.name : participantName || '',
    teamName: team.name,
    place,
    score: totalScore ? totalScore.toFixed(2) : '',
    eventName,
    organizerName,
    organizerTitle,
    specialAward: specialAward || '',
  };

  const emailTemplates = templates.email;
  const greetingText = applyTemplate(emailTemplates.greeting, context);
  const bodyTeamText = applyTemplate(emailTemplates.bodyTeam, context);
  const bodyIndividualText = applyTemplate(emailTemplates.bodyIndividual, context);
  const footerText = applyTemplate(emailTemplates.footer, context);
  const emailSubject = applyTemplate(emailTemplates.subject, context);

  // Генерируем HTML email
  const emailHtml = await render(
    React.createElement(CertificateEmail, {
      recipientName: type === 'team' ? team.name : participantName || '',
      certificateType: type,
      teamName: team.name,
      place: place <= 3 ? place : undefined,
      score: type === 'team' ? totalScore : undefined,
      eventName,
      greetingText,
      teamText: bodyTeamText,
      individualText: bodyIndividualText,
      footerText,
    })
  );

  const smtpInfo = await sendCertificateEmail({
    to: participantEmail,
    html: emailHtml,
    pdfBuffer,
    filename: `certificate-${type === 'team' ? team.name : participantName}.pdf`,
    subject: emailSubject,
  });

  return smtpInfo;
}

// POST: Отправка сертификата одному получателю
export async function POST(request: NextRequest) {
  try {
    const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }
    
    let body: SendCertificateRequest;
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
    
    // Проверка доступа к eventId для Jury
    if (authResult.session.role === 'Jury' && authResult.session.eventId !== body.eventId) {
      return NextResponse.json(
        { error: 'Доступ запрещён: вы не назначены на это мероприятие' },
        { status: 403 }
      );
    }
    
    if (!body.eventId) {
      return NextResponse.json(
        { error: 'eventId обязателен' },
        { status: 400 }
      );
    }
    
    if (!body.participantEmail) {
      return NextResponse.json(
        { error: 'Email получателя обязателен' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.participantEmail)) {
      return NextResponse.json(
        { error: 'Некорректный формат email' },
        { status: 400 }
      );
    }

    const smtpInfo = await sendSingleCertificate(body);

    return NextResponse.json({
      success: true,
      message: 'Сертификат успешно отправлен',
      smtp: smtpInfo,
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
    const authResult = checkApiAuth(request, ['Admin', 'Event_Manager']);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }
    
    let body: SendBulkRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }
    
    // Валидация UUID формата eventId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (body.eventId && !uuidRegex.test(body.eventId)) {
      return NextResponse.json(
        { error: 'Некорректный формат eventId' },
        { status: 400 }
      );
    }
    
    if (!body.eventId) {
      return NextResponse.json(
        { error: 'eventId обязателен' },
        { status: 400 }
      );
    }
    
    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'Список получателей обязателен' },
        { status: 400 }
      );
    }

    // Validate all emails before sending
    const invalidEmails = body.recipients.filter(r => !isValidEmail(r.participantEmail));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { 
          error: 'Некорректные email адреса', 
          invalidEmails: invalidEmails.map(r => r.participantEmail) 
        },
        { status: 400 }
      );
    }

    // Limit bulk send to prevent abuse
    const MAX_BULK_RECIPIENTS = 50;
    if (body.recipients.length > MAX_BULK_RECIPIENTS) {
      return NextResponse.json(
        { error: `Максимум ${MAX_BULK_RECIPIENTS} получателей за один запрос` },
        { status: 400 }
      );
    }

    const results: Array<{ email: string; success: boolean; smtp?: unknown }> = [];
    const errors = [];

    // Отправляем сертификаты последовательно
    for (const recipient of body.recipients) {
      try {
        const smtpInfo = await sendSingleCertificate({
          ...recipient,
          eventId: body.eventId,
        });
        results.push({
          email: recipient.participantEmail,
          success: true,
          smtp: smtpInfo,
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