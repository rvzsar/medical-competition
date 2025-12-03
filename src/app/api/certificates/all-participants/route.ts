import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import ReactPDF, { DocumentProps } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation } from 'docx';
import { getTeams } from '@/utils/redisStorage';

// Генерация DOCX сертификата участника
// A5: 148mm x 210mm (portrait), для landscape переворачиваем
// В docx для landscape указываем portrait размеры, библиотека сама перевернёт
async function generateParticipantDocx(participantName: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            // A5 portrait размеры (библиотека перевернёт для landscape)
            // 148mm x 210mm -> станет 210mm x 148mm
            width: 8391,   // 148mm в twips
            height: 11906, // 210mm в twips
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: {
            // После поворота: top/bottom - это короткие стороны (148мм)
            // left/right - это длинные стороны (210мм)
            // Сверху ~45мм (под заголовком "СЕРТИФИКАТ")
            top: 2550,
            // Снизу ~40мм (над подписью ректора и печатью)
            bottom: 2270,
            // По бокам ~30мм
            left: 1700,
            right: 1700,
          },
        },
      },
      children: [
        // Заголовок "ОБ УЧАСТИИ"
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: 'ОБ УЧАСТИИ',
              size: 28, // 14pt
              font: 'Times New Roman',
            }),
          ],
        }),
        // Имя участника с подчеркиванием
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: participantName,
              size: 26, // 13pt
              font: 'Times New Roman',
              underline: {},
            }),
          ],
        }),
        // Описание олимпиады
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: 'в I Межвузовской студенческой олимпиаде по акушерству и гинекологии',
              size: 22, // 11pt
              font: 'Times New Roman',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: 'им. профессора В.В. Горячева.',
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        }),
        // Дата
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Самара, 04 ноября 2025 г.',
              size: 20, // 10pt
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
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamIds, format = 'pdf' } = body; // format: 'pdf' или 'docx'

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

    // Ограничение для Vercel
    const MAX_PARTICIPANTS = format === 'docx' ? 30 : 15; // DOCX быстрее генерируется
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
    const fileExtension = format === 'docx' ? 'docx' : 'pdf';

    if (format === 'docx') {
      // Генерация DOCX
      for (const participant of allParticipants) {
        const docxBuffer = await generateParticipantDocx(participant.name);
        
        const safeTeamName = participant.teamName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const safeName = participant.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const fileName = `${safeTeamName}/${safeName}.${fileExtension}`;
        
        zip.file(fileName, docxBuffer);
      }
    } else {
      // Генерация PDF
      const { default: ParticipantCertificate } = await import(
        '@/components/certificates/ParticipantCertificate'
      );

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

        const safeTeamName = participant.teamName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const safeName = participant.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_');
        const fileName = `${safeTeamName}/${safeName}.${fileExtension}`;
        
        zip.file(fileName, pdfBuffer);
      }
    }

    // Генерируем ZIP
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
