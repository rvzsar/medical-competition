import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { getTeams } from '@/utils/redisStorage';

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamIds } = body; // Опционально: массив ID команд для фильтрации

    // Получаем все команды
    const teams = await getTeams();

    // Фильтруем команды если указаны конкретные
    const selectedTeams = teamIds && teamIds.length > 0
      ? teams.filter(t => teamIds.includes(t.id))
      : teams;

    // Собираем всех участников
    const allParticipants: { name: string; teamName: string }[] = [];
    for (const team of selectedTeams) {
      for (const member of team.members) {
        allParticipants.push({
          name: member,
          teamName: team.name,
        });
      }
    }

    if (allParticipants.length === 0) {
      return NextResponse.json(
        { error: 'Нет участников для генерации' },
        { status: 400 }
      );
    }

    // Ограничение для Vercel (10 секунд timeout)
    const MAX_PARTICIPANTS = 15;
    if (allParticipants.length > MAX_PARTICIPANTS) {
      return NextResponse.json(
        { 
          error: `Слишком много участников (${allParticipants.length}). Максимум ${MAX_PARTICIPANTS} за раз.`,
          hint: 'Выберите конкретные команды для генерации',
          totalParticipants: allParticipants.length,
        },
        { status: 400 }
      );
    }

    // Создаем ZIP архив
    const zip = new JSZip();
    const { default: ParticipantCertificate } = await import(
      '@/components/certificates/ParticipantCertificate'
    );

    // Генерируем сертификат для каждого участника
    for (const participant of allParticipants) {
      const pdfStream = await ReactPDF.renderToStream(
        React.createElement(ParticipantCertificate, {
          participantName: participant.name,
        }) as React.ReactElement<DocumentProps>
      );

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfStream.on('end', () => resolve());
        pdfStream.on('error', (error: Error) => reject(error));
      });

      const pdfBuffer = Buffer.concat(chunks);

      // Имя файла: Команда_Участник.pdf
      const safeTeamName = participant.teamName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
      const safeName = participant.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
      const fileName = `${safeTeamName}/${safeName}.pdf`;
      
      zip.file(fileName, pdfBuffer);
    }

    // Генерируем ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="certificates-participants.zip"`,
      },
    });
  } catch (error) {
    console.error('Ошибка при генерации сертификатов участников:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при генерации сертификатов',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - получить список всех участников
export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await getTeams();

    const participants = teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      members: team.members,
      count: team.members.length,
    }));

    const totalCount = participants.reduce((sum, t) => sum + t.count, 0);

    return NextResponse.json({
      teams: participants,
      totalParticipants: totalCount,
    });
  } catch (error) {
    console.error('Ошибка при получении списка участников:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    );
  }
}
