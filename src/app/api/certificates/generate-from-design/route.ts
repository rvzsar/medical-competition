/**
 * API Route: Generate Certificate from Design Template
 * 
 * Генерирует PDF сертификат на основе визуального шаблона из конструктора
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth } from '@/lib/api-auth';
import { getDesignTemplate } from '@/services/certificateDesignService';
import { generatePdfFromDesign, generateCertificateNumber, type CertificateData } from '@/services/certificatePdfFromDesign';
import { getTeamsByEventId } from '@/services/teamService';
import { getScoresByEventId } from '@/services/scoreService';
import { getCertificateTemplates } from '@/services/certificateService';
import type { AggregatedScore } from '@/types';

interface GenerateRequest {
  eventId: string;
  type: 'team' | 'individual';
  teamId?: string;
  participantName?: string;
}

// Расчет общего балла команды
function calculateTotalScore(teamId: string, allScores: AggregatedScore[]): number {
  const teamScores = allScores.filter(s => s.teamId === teamId);
  return teamScores.reduce((sum, score) => sum + score.averageScore, 0);
}

export async function POST(request: NextRequest) {
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body: GenerateRequest = await request.json();
    const { eventId, type, teamId, participantName } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId обязателен' }, { status: 400 });
    }

    // Проверка доступа для Jury
    if (authResult.session.role === 'Jury' && authResult.session.eventId !== eventId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    // Получаем шаблон дизайна
    const designTemplate = await getDesignTemplate(eventId);
    
    if (!designTemplate) {
      return NextResponse.json(
        { error: 'Шаблон дизайна не найден. Создайте шаблон в конструкторе сертификатов.' },
        { status: 404 }
      );
    }

    // Получаем данные
    const teams = await getTeamsByEventId(eventId);
    const scores = await getScoresByEventId(eventId);
    const templates = await getCertificateTemplates(eventId);

    // Определяем место команды
    let place: number | undefined;
    let teamName: string | undefined;
    let totalScore: number | undefined;

    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
      }
      teamName = team.name;
      totalScore = calculateTotalScore(teamId, scores);

      // Рассчитываем место
      const teamTotals = teams.map(t => ({
        teamId: t.id,
        totalScore: calculateTotalScore(t.id, scores)
      }));
      const sortedScores = teamTotals.sort((a, b) => b.totalScore - a.totalScore);
      place = sortedScores.findIndex(s => s.teamId === teamId) + 1;
    }

    // Формируем данные для сертификата
    const certificateData: CertificateData = {
      recipientName: type === 'individual' && participantName ? participantName : teamName || '',
      teamName,
      eventName: templates.organizer.eventName,
      date: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      place: place && place <= 3 ? place : undefined,
      score: totalScore !== undefined ? totalScore.toFixed(2) : undefined,
      certificateNumber: generateCertificateNumber(),
      organizerName: templates.organizer.name,
      organizerTitle: templates.organizer.title,
    };

    // Генерируем PDF
    const pdfBuffer = await generatePdfFromDesign(designTemplate, certificateData);

    const filename = type === 'individual' && participantName
      ? `certificate-${participantName.replace(/\s+/g, '-')}.pdf`
      : `certificate-team-${teamName?.replace(/\s+/g, '-') || 'unknown'}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Generate from design error:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации сертификата', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
