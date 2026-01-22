/**
 * Server Actions для управления оценками
 * 
 * Requirements: 5.1, 9.5
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as scoreService from '@/services/scoreService';
import * as juryService from '@/services/juryService';
import {
  SubmitScoreSchema,
  UpdateScoreSchema,
  type SubmitScoreInput,
  type UpdateScoreInput,
} from '@/lib/validation';
import type { Score, AggregatedScore } from '@/types';

/**
 * Отправить оценку
 */
export async function submitScore(
  input: SubmitScoreInput,
  csrfToken: string
): Promise<{ success: true; data: Score } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    const session = await checkPermission(['Jury'], input.eventId, input.contestId);

    // Проверить что жюри назначен на этот конкурс
    const hasAccess = await juryService.hasJuryAccessToContest(
      session.userId,
      input.contestId
    );

    if (!hasAccess) {
      return { success: false, error: 'Жюри не назначен на этот конкурс' };
    }

    const validated = SubmitScoreSchema.parse(input);
    const score = await scoreService.submitScore(validated);

    revalidateTag(`contest:${input.contestId}:scores`);
    revalidateTag(`event:${input.eventId}:scores`);

    return { success: true, data: score };
  } catch (error) {
    console.error('Failed to submit score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить оценку
 */
export async function updateScore(
  scoreId: string,
  input: UpdateScoreInput,
  csrfToken: string
): Promise<{ success: true; data: Score } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    
    const existing = await scoreService.getScoreById(scoreId);
    if (!existing) {
      return { success: false, error: 'Оценка не найдена' };
    }

    const session = await checkPermission(
      ['Jury'],
      existing.eventId,
      existing.contestId
    );

    // Проверить что это оценка этого жюри
    if (existing.juryId !== session.userId) {
      return { success: false, error: 'Можно редактировать только свои оценки' };
    }

    const validated = UpdateScoreSchema.parse({ ...input, id: scoreId });
    const score = await scoreService.updateScore(
      scoreId,
      validated,
      session.userId,
      validated.reason
    );

    if (!score) {
      return { success: false, error: 'Оценка не найдена' };
    }

    revalidateTag(`contest:${existing.contestId}:scores`);
    revalidateTag(`event:${existing.eventId}:scores`);
    revalidateTag(`score:${scoreId}`);

    return { success: true, data: score };
  } catch (error) {
    console.error('Failed to update score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить оценки конкурса
 */
export async function getContestScores(
  contestId: string
): Promise<{ success: true; data: Score[] } | { success: false; error: string }> {
  try {
    // Получить первую оценку чтобы узнать eventId
    const allScores = await scoreService.getScoresByContestId(contestId);
    const eventId = allScores[0]?.eventId;

    if (eventId) {
      await checkPermission(['Admin', 'Event_Manager', 'Jury'], eventId);
    }

    return { success: true, data: allScores };
  } catch (error) {
    console.error('Failed to get contest scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить агрегированную оценку
 */
export async function getAggregatedScore(
  contestId: string,
  teamId?: string,
  participantId?: string
): Promise<
  { success: true; data: AggregatedScore } | { success: false; error: string }
> {
  try {
    const aggregated = await scoreService.calculateAggregatedScore(
      contestId,
      teamId,
      participantId
    );

    if (!aggregated) {
      return { success: false, error: 'Оценки не найдены' };
    }

    await checkPermission(['Admin', 'Event_Manager', 'Jury'], aggregated.eventId);

    return { success: true, data: aggregated };
  } catch (error) {
    console.error('Failed to get aggregated score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
