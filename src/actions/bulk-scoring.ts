/**
 * Server Actions для массового ввода оценок жюри
 * 
 * Requirements: 3.2, 3.3, 3.4, 7.2
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as scoreService from '@/services/scoreService';
import { getContestById } from '@/services/contestService';
import { getJuryMemberById } from '@/services/juryService';
import { getParticipantById } from '@/services/participantService';
import { getTeamById } from '@/services/teamService';
import type { Score } from '@/types';
import type { BulkScoreSubmission, ExportRow } from '@/types/bulk-scoring';
import { formatJuryFullName } from '@/utils/scoring';

/**
 * Отправить оценку от имени жюри (для админа)
 * Property 7: Score Attribution Correctness
 * Property 9: Score Validation Bounds
 */
export async function submitBulkScore(
  data: BulkScoreSubmission,
  eventId: string,
  csrfToken: string
): Promise<{ success: true; data: Score } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    const session = await checkPermission(['Admin', 'Event_Manager'], eventId);

    // Получить конкурс для валидации критериев
    const contest = await getContestById(data.contestId);
    if (!contest) {
      return { success: false, error: 'Конкурс не найден' };
    }

    // Валидация оценок по критериям
    for (const criterion of contest.criteria) {
      const value = data.criteriaScores[criterion.id];
      
      if (value === undefined) {
        return { 
          success: false, 
          error: `Отсутствует оценка для критерия: ${criterion.name}` 
        };
      }

      if (criterion.type === 'numeric') {
        const minValue = criterion.minValue ?? 0;
        const maxValue = criterion.maxValue ?? 100;
        
        if (typeof value !== 'number' || value < minValue || value > maxValue) {
          return { 
            success: false, 
            error: `Оценка ${value} выходит за пределы [${minValue}, ${maxValue}] для критерия "${criterion.name}"` 
          };
        }
      }
    }

    // Получить данные для протокола
    const jury = await getJuryMemberById(data.juryId);
    const juryName = jury ? formatJuryFullName(jury) : data.juryId;

    let entityName = '';
    if (data.participantId) {
      const participant = await getParticipantById(data.participantId);
      entityName = participant 
        ? `${participant.lastName} ${participant.firstName}` 
        : data.participantId;
    } else if (data.teamId) {
      const team = await getTeamById(data.teamId);
      entityName = team?.name || data.teamId;
    }

    // Проверить существующую оценку
    const existingScore = await scoreService.getExistingScore(
      data.contestId,
      data.juryId,
      data.teamId,
      data.participantId
    );

    if (existingScore) {
      // Обновить существующую оценку
      const updated = await scoreService.updateScore(
        existingScore.id,
        { criteriaScores: data.criteriaScores },
        session.userId,
        'Обновлено через массовый ввод'
      );

      if (!updated) {
        return { success: false, error: 'Не удалось обновить оценку' };
      }

      revalidateTag(`contest:${data.contestId}:scores`);
      revalidateTag(`event:${eventId}:scores`);

      return { success: true, data: updated };
    }

    // Создать новую оценку
    const score = await scoreService.submitScore({
      eventId,
      contestId: data.contestId,
      teamId: data.teamId,
      participantId: data.participantId,
      juryId: data.juryId,
      criteriaScores: data.criteriaScores,
      contestName: contest.name,
      juryName,
      teamName: data.teamId ? entityName : undefined,
      participantName: data.participantId ? entityName : undefined,
    });

    revalidateTag(`contest:${data.contestId}:scores`);
    revalidateTag(`event:${eventId}:scores`);

    return { success: true, data: score };
  } catch (error) {
    console.error('Failed to submit bulk score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить оценку (для админа)
 */
export async function deleteBulkScore(
  scoreId: string,
  eventId: string,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin'], eventId);

    // FIXME: Implement score deletion in scoreService when needed
    // For now, return error
    return { success: false, error: 'Удаление оценок пока не реализовано' };
  } catch (error) {
    console.error('Failed to delete score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Экспортировать матрицу оценок
 * Property 15: Export Data Completeness
 */
export async function exportScoreMatrix(
  eventId: string,
  contestId: string | 'all',
  csrfToken: string
): Promise<{ success: true; data: ExportRow[] } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    // Получить все оценки мероприятия
    const aggregatedScores = await scoreService.getScoresByEventId(eventId);
    
    // Преобразовать в формат экспорта
    const exportData: ExportRow[] = aggregatedScores.map(agg => ({
      participantName: agg.teamId || agg.participantId || 'Неизвестно',
      participantId: agg.teamId || agg.participantId || '',
      contestName: agg.contestId,
      juryScores: agg.juryScores.map(js => ({
        juryName: js.juryName,
        score: js.score,
      })),
      averageScore: agg.averageScore,
      status: agg.juryScores.length > 0 ? 'complete' : 'none',
    }));

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Failed to export score matrix:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
