import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation } from 'docx';
import { getTeamsByEventId } from '@/services/teamService';
import { getEventById } from '@/services/eventService';
import { getCertificateTemplates } from '@/services/certificateService';
import { checkApiAuth, authErrorResponse } from '@/lib/api-auth';

// Генерация DOCX сертификата участника
async function generateParticipantDocx(
  participantName: string,
  eventName: string,
  eventDate: string,
  eventLocation: string
): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: 8391,
            height: 11906,
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: {
            top: 2550,
            bottom: 2270,
            left: 1700,
            right: 1700,
          },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: 'ОБ УЧАСТИИ',
              size: 28,
              font: 'Times New Roman',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: participantName,
              size: 26,
              font: 'Times New Roman',
              underline: {},
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: `в ${eventName}`,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${eventLocation ? eventLocation + ', ' : ''}${eventDate}`,
              size: 20,
              font: 'Times New Roman',
              shading: { fill: 'CCCCCC' },
            }),
          ],
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    let body: { eventId?: string; teamIds?: string[]; format?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }
    
    const { eventId, teamIds, format = 'pdf' } = body;
    
    // Валидация UUID форматов
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (eventId && !uuidRegex.test(eventId)) {
      return NextResponse.json(
        { error: 'Некорректный формат eventId' },
        { status: 400 }
      );
    }
    if (teamIds && Array.isArray(teamIds)) {
      for (const teamId of teamIds) {
        if (!uuidRegex.test(teamId)) {
          return NextResponse.json(
            { error: 'Некорректный формат teamId в массиве' },
            { status: 400 }
          );
        }
      }
    }
    
    // Валидация формата
    if (format !== 'pdf' && format !== 'docx') {
      return NextResponse.json(
        { error: 'Формат должен быть pdf или docx' },
        { status: 400 }
      );
    }
    
    // Проверка доступа к eventId для Jury
    if (authResult.session.role === 'Jury' && authResult.session.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Доступ запрещён: вы не назначены на это мероприятие' },
        { status: 403 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId обязателен' },
        { status: 400 }
      );
    }

    // Получаем данные мероприятия
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Мероприятие не найдено' },
        { status: 404 }
      );
    }

    const templates = await getCertificateTemplates(eventId);
    const teams = await getTeamsByEventId(eventId);

    // Фильтруем команды если указаны конкретные
    const selectedTeams = teamIds && teamIds.length > 0
      ? teams.filter(t => teamIds.includes(t.id))
      : teams;

    // Собираем всех участников
    const allParticipants: { name: string; teamName: string }[] = [];
    for (const team of selectedTeams) {
      if (team.members && Array.isArray(team.members)) {
        for (const member of team.members) {
          allParticipants.push({
            name: typeof member === 'string' ? member : `${member}`,
            teamName: team.name,
          });
        }
      }
    }

    if (allParticipants.length === 0) {
      return NextResponse.json(
        { error: 'Нет участников для генерации' },
        { status: 400 }
      );
    }

    // Ограничение для Vercel
    const MAX_PARTICIPANTS = format === 'docx' ? 30 : 15;
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

    // Форматируем дату
    const eventDate = event.startDate 
      ? new Date(event.startDate).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    const eventLocation = event.location || '';
    const eventName = templates.organizer.eventName || event.name;

    // Создаем ZIP архив
    const zip = new JSZip();
    const fileExtension = format === 'docx' ? 'docx' : 'pdf';

    if (format === 'docx') {
      for (const participant of allParticipants) {
        const docxBuffer = await generateParticipantDocx(
          participant.name,
          eventName,
          eventDate,
          eventLocation
        );
        
        const safeTeamName = participant.teamName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const safeName = participant.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const fileName = `${safeTeamName}/${safeName}.${fileExtension}`;
        
        zip.file(fileName, docxBuffer);
      }
    } else {
      const { default: ParticipantCertificate } = await import(
        '@/components/certificates/ParticipantCertificate'
      );

      for (const participant of allParticipants) {
        const pdfStream = await ReactPDF.renderToStream(
          React.createElement(ParticipantCertificate, {
            participantName: participant.name,
            eventName,
            eventDate: event.startDate,
            eventLocation,
          }) as React.ReactElement<DocumentProps>
        );

        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
          pdfStream.on('end', () => resolve());
          pdfStream.on('error', (error: Error) => reject(error));
        });

        const pdfBuffer = Buffer.concat(chunks);

        const safeTeamName = participant.teamName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const safeName = participant.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const fileName = `${safeTeamName}/${safeName}.${fileExtension}`;
        
        zip.file(fileName, pdfBuffer);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="certificates-participants-${format}.zip"`,
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

// GET - получить список всех участников мероприятия
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
        { error: 'eventId обязателен' },
        { status: 400 }
      );
    }
    
    // Валидация UUID формата
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return NextResponse.json(
        { error: 'Некорректный формат eventId' },
        { status: 400 }
      );
    }
    
    // Проверка доступа к eventId для Jury
    if (authResult.session.role === 'Jury' && authResult.session.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    const teams = await getTeamsByEventId(eventId);

    const participants = teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      members: team.members || [],
      count: (team.members || []).length,
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
