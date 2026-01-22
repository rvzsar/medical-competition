/**
 * API Route: Export Results
 * 
 * Экспорт результатов мероприятия в PDF или Excel
 * 
 * GET /api/events/[eventId]/results/export?format=pdf|excel
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth, authErrorResponse } from '@/lib/api-auth';
import { getEventById } from '@/services/eventService';
import { getEventResults } from '@/services/resultsService';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Проверка авторизации
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager', 'Jury']);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const { eventId } = await params;
  
  // Валидация UUID
  if (!UUID_REGEX.test(eventId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный формат eventId' },
      { status: 400 }
    );
  }

  // Проверка доступа для не-Admin
  if (authResult.session && authResult.session.role !== 'Admin' && authResult.session.eventId !== eventId) {
    return NextResponse.json(
      { success: false, error: 'Нет доступа к этому мероприятию' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'excel';

  if (!['pdf', 'excel'].includes(format)) {
    return NextResponse.json(
      { success: false, error: 'Неподдерживаемый формат. Используйте pdf или excel' },
      { status: 400 }
    );
  }

  try {
    // Получить мероприятие
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Мероприятие не найдено' },
        { status: 404 }
      );
    }

    // Получить результаты
    const results = await getEventResults(eventId);

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Нет результатов для экспорта' },
        { status: 404 }
      );
    }

    if (format === 'excel') {
      // Генерация CSV (простой Excel-совместимый формат)
      const csvContent = generateCSV(event.name, results);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="results-${eventId}.csv"`,
        },
      });
    } else {
      // PDF - генерируем HTML для печати
      const htmlContent = generatePrintableHTML(event.name, results);
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="results-${eventId}.html"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при экспорте результатов' },
      { status: 500 }
    );
  }
}

interface ResultRow {
  rank: number;
  name: string;
  institution?: string;
  totalScore: number;
  contestScores: Array<{
    contestName: string;
    score: number;
  }>;
}

function generateCSV(eventName: string, results: ResultRow[]): string {
  // BOM для корректного отображения UTF-8 в Excel
  const BOM = '\uFEFF';
  
  // Собрать уникальные названия конкурсов
  const contestNames = new Set<string>();
  results.forEach(r => r.contestScores.forEach(cs => contestNames.add(cs.contestName)));
  const contestList = Array.from(contestNames);
  
  // Заголовок
  const headers = ['Место', 'Участник', 'Учреждение', ...contestList, 'Итого'];
  
  // Строки данных
  const rows = results.map(r => {
    const contestScores = contestList.map(name => {
      const cs = r.contestScores.find(c => c.contestName === name);
      return cs ? cs.score.toFixed(2) : '0.00';
    });
    
    return [
      r.rank.toString(),
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.institution || '—').replace(/"/g, '""')}"`,
      ...contestScores,
      r.totalScore.toFixed(2),
    ];
  });
  
  // Собрать CSV
  const csvLines = [
    `# Результаты: ${eventName}`,
    `# Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}`,
    '',
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ];
  
  return BOM + csvLines.join('\n');
}

function generatePrintableHTML(eventName: string, results: ResultRow[]): string {
  // Собрать уникальные названия конкурсов
  const contestNames = new Set<string>();
  results.forEach(r => r.contestScores.forEach(cs => contestNames.add(cs.contestName)));
  const contestList = Array.from(contestNames);
  
  const tableRows = results.map(r => {
    const contestCells = contestList.map(name => {
      const cs = r.contestScores.find(c => c.contestName === name);
      return `<td>${cs ? cs.score.toFixed(2) : '—'}</td>`;
    }).join('');
    
    return `
      <tr>
        <td class="rank ${r.rank <= 3 ? `rank-${r.rank}` : ''}">${r.rank}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.institution || '—')}</td>
        ${contestCells}
        <td class="total">${r.totalScore.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  const contestHeaders = contestList.map(name => `<th>${escapeHtml(name)}</th>`).join('');
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Результаты: ${escapeHtml(eventName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { text-align: center; margin-bottom: 10px; font-size: 24px; }
    .date { text-align: center; color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .rank { text-align: center; font-weight: bold; }
    .rank-1 { background: #ffd700; }
    .rank-2 { background: #c0c0c0; }
    .rank-3 { background: #cd7f32; }
    .total { font-weight: bold; text-align: right; }
    @media print {
      body { padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
    .print-btn { 
      display: block; 
      margin: 20px auto; 
      padding: 10px 30px; 
      font-size: 16px;
      cursor: pointer;
    }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(eventName)}</h1>
  <p class="date">Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
  
  <table>
    <thead>
      <tr>
        <th>Место</th>
        <th>Участник</th>
        <th>Учреждение</th>
        ${contestHeaders}
        <th>Итого</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <button class="print-btn" onclick="window.print()">🖨️ Печать</button>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
