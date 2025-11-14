import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import { AggregatedScore } from '@/types';
import type { TeamCertificateProps } from '@/components/certificates/TeamCertificate';
import type { IndividualCertificateProps } from '@/components/certificates/IndividualCertificate';
import { getAggregatedScores, getTeams, getCertificateTemplates } from '@/utils/redisStorage';

interface GenerateCertificateRequest {
  type: 'team' | 'individual';
  teamId?: string;
  participantName?: string;
  specialAward?: string;
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

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body: GenerateCertificateRequest = await request.json();
    const { type, teamId, participantName, specialAward } = body;

    // Получаем данные о командах и результатах
    const teams = await getTeams();
    const scores = await getAggregatedScores();

    if (type === 'team' && teamId) {
      // Генерация командного сертификата
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        return NextResponse.json(
          { error: 'Команда не найдена' },
          { status: 404 }
        );
      }

      // Рассчитываем общий балл команды
      const totalScore = calculateTotalScore(teamId, scores);
      
      if (totalScore === 0) {
        return NextResponse.json(
          { error: 'Результаты команды не найдены' },
          { status: 404 }
        );
      }

      // Определяем место команды
      const teamTotals = teams.map(t => ({
        teamId: t.id,
        totalScore: calculateTotalScore(t.id, scores as AggregatedScore[])
      }));
      const sortedScores = teamTotals.sort((a, b) => b.totalScore - a.totalScore);
      const place = sortedScores.findIndex(s => s.teamId === teamId) + 1;

      const certificateData: TeamCertificateProps = {
        teamName: team.name,
        place: place <= 3 ? place : 0,
        score: totalScore,
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

      // Динамический импорт компонента
      const templates = await getCertificateTemplates();
      const { default: TeamCertificate } = await import('@/components/certificates/TeamCertificate');
      
      // Генерируем PDF
      const pdfStream = await ReactPDF.renderToStream(
        React.createElement(TeamCertificate, {
          ...certificateData,
          titleText: templates.pdf.teamTitle,
          introText: templates.pdf.teamIntro,
        }) as React.ReactElement<DocumentProps>
      );

      // Конвертируем stream в buffer
      const chunks: Buffer[] = [];
      
      return new Promise<NextResponse>((resolve, reject) => {
        pdfStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        pdfStream.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="certificate-team-${team.name.replace(/\s+/g, '-')}.pdf"`,
            },
          }));
        });

        pdfStream.on('error', (error: Error) => {
          reject(error);
        });
      });

    } else if (type === 'individual' && participantName && teamId) {
      // Генерация именного сертификата
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

      const certificateData: IndividualCertificateProps = {
        participantName,
        teamName: team.name,
        achievement: getAchievementText(place),
        specialAward,
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

      // Динамический импорт компонента
      const templates = await getCertificateTemplates();
      const { default: IndividualCertificate } = await import('@/components/certificates/IndividualCertificate');
      
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
      
      return new Promise<NextResponse>((resolve, reject) => {
        pdfStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        pdfStream.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="certificate-${participantName.replace(/\s+/g, '-')}.pdf"`,
            },
          }));
        });

        pdfStream.on('error', (error: Error) => {
          reject(error);
        });
      });

    } else {
      return NextResponse.json(
        { error: 'Неверные параметры запроса' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Ошибка при генерации сертификата:', error);
    return NextResponse.json(
      { error: 'Ошибка при генерации сертификата', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}