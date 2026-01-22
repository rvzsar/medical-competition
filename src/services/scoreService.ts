/**
 * ScoreService - управление оценками
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { safeRedisOperation, safeRedisWrite } from '@/lib/redis-wrapper';
import type { Score, ScoreEdit, AggregatedScore, Criteria } from '@/types';
import { randomUUID } from 'crypto';
import { validateCriteriaValue } from '@/lib/validation';
import { getContestById } from './contestService';

const SCORES_KEY_PREFIX = 'score:';
const CONTEST_SCORES_KEY_PREFIX = 'contest:scores:';
const JURY_SCORES_KEY_PREFIX = 'jury:scores:';
const EVENT_SCORES_KEY_PREFIX = 'event:scores:';
const SCORE_LOG_KEY = 'score:log';

/**
 * Максимальное количество записей в протоколе оценок.
 * 500 записей достаточно для хранения истории за одно мероприятие
 * при среднем количестве 50 участников * 5 конкурсов * 2 изменения.
 */
const MAX_LOG_ENTRIES = 500;

/** Количество ключей для SCAN операции за один проход */
const SCAN_COUNT = 100;

// ============================================================================
// ПРОТОКОЛ ОЦЕНОК (Score Log) - определяем в начале для использования в submitScore
// ============================================================================

/**
 * Запись в протоколе оценок
 */
export interface ScoreLogEntry {
  timestamp: string;
  eventId: string;
  eventName?: string;
  contestId: string;
  contestName?: string;
  teamId?: string;
  teamName?: string;
  participantId?: string;
  participantName?: string;
  juryId: string;
  juryName: string;
  previousScore: number | null;
  newScore: number;
  action: 'create' | 'update';
}

/**
 * Добавить запись в протокол оценок
 */
async function appendScoreLog(entry: ScoreLogEntry): Promise<void> {
  await safeRedisWrite(async (redis) => {
    await redis.lPush(SCORE_LOG_KEY, JSON.stringify(entry));
    await redis.lTrim(SCORE_LOG_KEY, 0, MAX_LOG_ENTRIES - 1);
  });
}

/**
 * Получить протокол оценок
 */
export async function getScoreLog(limit: number = 100): Promise<ScoreLogEntry[]> {
  return safeRedisOperation(
    async (redis) => {
      const items = await redis.lRange(SCORE_LOG_KEY, 0, limit - 1);
      
      return items
        .map((raw: string) => {
          try {
            return JSON.parse(raw) as ScoreLogEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is ScoreLogEntry => entry !== null);
    },
    []
  );
}

/**
 * Очистить протокол оценок
 */
export async function clearScoreLog(): Promise<boolean> {
  return safeRedisWrite(async (redis) => {
    await redis.del(SCORE_LOG_KEY);
  });
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Вычислить итоговую оценку из criteriaScores
 */
function calculateTotalScore(
  criteriaScores: Record<string, number | boolean | string>,
  criteria: Criteria[]
): number {
  let total = 0;

  for (const criterion of criteria) {
    const value = criteriaScores[criterion.id];

    if (criterion.type === 'numeric' && typeof value === 'number') {
      total += value * (criterion.weight || 1);
    } else if (criterion.type === 'boolean' && typeof value === 'boolean') {
      // Boolean: true = maxValue, false = 0
      if (value && criterion.maxValue !== undefined) {
        total += criterion.maxValue * (criterion.weight || 1);
      }
    }
    // dropdown не влияет на оценку напрямую
  }

  return total;
}

/**
 * Проверить существует ли уже оценка от этого жюри
 */
export async function getExistingScore(
  contestId: string,
  juryId: string,
  teamId?: string,
  participantId?: string
): Promise<Score | null> {
  const allScores = await getScoresByContestId(contestId);
  
  return allScores.find((s) => {
    if (s.juryId !== juryId) return false;
    if (teamId && s.teamId === teamId) return true;
    if (participantId && s.participantId === participantId) return true;
    return false;
  }) || null;
}

/**
 * Отправить оценку
 */
export async function submitScore(data: {
  eventId: string;
  contestId: string;
  teamId?: string;
  participantId?: string;
  juryId: string;
  criteriaScores: Record<string, number | boolean | string>;
  bonusPoints?: number;
  penaltyPoints?: number;
  notes?: string;
  // Дополнительные данные для протокола
  eventName?: string;
  contestName?: string;
  teamName?: string;
  participantName?: string;
  juryName?: string;
}): Promise<Score> {
  // Проверить нет ли уже оценки от этого жюри
  const existingScore = await getExistingScore(
    data.contestId,
    data.juryId,
    data.teamId,
    data.participantId
  );
  
  if (existingScore) {
    throw new Error(
      'Вы уже оценили этого участника/команду. Используйте редактирование для изменения оценки.'
    );
  }

  // Получить конкурс для валидации критериев
  const contest = await getContestById(data.contestId);
  if (!contest) {
    throw new Error('Конкурс не найден');
  }

  // Валидация criteriaScores
  for (const criterion of contest.criteria) {
    const value = data.criteriaScores[criterion.id];

    if (value === undefined) {
      throw new Error(`Отсутствует оценка для критерия: ${criterion.name}`);
    }

    if (!validateCriteriaValue(value, criterion)) {
      throw new Error(`Некорректное значение для критерия: ${criterion.name}`);
    }
  }

  // Вычислить итоговую оценку
  const baseScore = calculateTotalScore(data.criteriaScores, contest.criteria);
  const totalScore =
    baseScore + (data.bonusPoints || 0) - (data.penaltyPoints || 0);

  const score: Score = {
    id: randomUUID(),
    eventId: data.eventId,
    contestId: data.contestId,
    teamId: data.teamId,
    participantId: data.participantId,
    juryId: data.juryId,
    criteriaScores: data.criteriaScores,
    totalScore,
    bonusPoints: data.bonusPoints,
    penaltyPoints: data.penaltyPoints,
    notes: data.notes,
    submittedAt: new Date(),
    editHistory: [],
  };

  // Используем MULTI/EXEC для атомарной записи всех данных
  const success = await safeRedisWrite(async (redis) => {
    const multi = redis.multi();
    
    // Сохранить оценку
    multi.hSet(`${SCORES_KEY_PREFIX}${score.id}`, {
      id: score.id,
      eventId: score.eventId,
      contestId: score.contestId,
      teamId: score.teamId || '',
      participantId: score.participantId || '',
      juryId: score.juryId,
      criteriaScores: JSON.stringify(score.criteriaScores),
      totalScore: score.totalScore.toString(),
      bonusPoints: score.bonusPoints?.toString() || '',
      penaltyPoints: score.penaltyPoints?.toString() || '',
      notes: score.notes || '',
      submittedAt: score.submittedAt.toISOString(),
      editHistory: JSON.stringify(score.editHistory),
    });

    // Добавить в индексы
    multi.sAdd(`${CONTEST_SCORES_KEY_PREFIX}${data.contestId}`, score.id);
    multi.sAdd(`${JURY_SCORES_KEY_PREFIX}${data.juryId}`, score.id);
    multi.sAdd(`${EVENT_SCORES_KEY_PREFIX}${data.eventId}`, score.id);
    
    await multi.exec();
  });

  if (!success) {
    throw new Error('Не удалось сохранить оценку');
  }

  // Записать в протокол
  try {
    await appendScoreLog({
      timestamp: new Date().toISOString(),
      eventId: data.eventId,
      eventName: data.eventName,
      contestId: data.contestId,
      contestName: data.contestName || contest.name,
      teamId: data.teamId,
      teamName: data.teamName,
      participantId: data.participantId,
      participantName: data.participantName,
      juryId: data.juryId,
      juryName: data.juryName || data.juryId,
      previousScore: null,
      newScore: totalScore,
      action: 'create',
    });
  } catch (logError) {
    // Не блокируем основную операцию если логирование не удалось
    console.warn('Failed to append score log:', logError);
  }

  return score;
}

/**
 * Обновить оценку (с аудит-логом)
 */
export async function updateScore(
  scoreId: string,
  data: {
    criteriaScores?: Record<string, number | boolean | string>;
    bonusPoints?: number;
    penaltyPoints?: number;
    notes?: string;
  },
  editedBy: string,
  reason?: string
): Promise<Score | null> {
  const existing = await getScoreById(scoreId);
  if (!existing) {
    return null;
  }

  // Получить конкурс для валидации
  const contest = await getContestById(existing.contestId);
  if (!contest) {
    throw new Error('Конкурс не найден');
  }

  // Валидация новых criteriaScores
  const newCriteriaScores = data.criteriaScores || existing.criteriaScores;
  for (const criterion of contest.criteria) {
    const value = newCriteriaScores[criterion.id];

    if (value === undefined) {
      throw new Error(`Отсутствует оценка для критерия: ${criterion.name}`);
    }

    if (!validateCriteriaValue(value, criterion)) {
      throw new Error(`Некорректное значение для критерия: ${criterion.name}`);
    }
  }

  // Вычислить новую итоговую оценку
  const baseScore = calculateTotalScore(newCriteriaScores, contest.criteria);
  const newTotalScore =
    baseScore +
    (data.bonusPoints ?? existing.bonusPoints ?? 0) -
    (data.penaltyPoints ?? existing.penaltyPoints ?? 0);

  // Добавить запись в историю изменений
  const edit: ScoreEdit = {
    editedAt: new Date(),
    editedBy,
    previousScore: existing.totalScore,
    newScore: newTotalScore,
    reason,
  };

  const updated: Score = {
    ...existing,
    criteriaScores: newCriteriaScores,
    totalScore: newTotalScore,
    bonusPoints: data.bonusPoints ?? existing.bonusPoints,
    penaltyPoints: data.penaltyPoints ?? existing.penaltyPoints,
    notes: data.notes ?? existing.notes,
    updatedAt: new Date(),
    editHistory: [...(existing.editHistory || []), edit],
  };

  const success = await safeRedisWrite(async (redis) => {
    await redis.hSet(`${SCORES_KEY_PREFIX}${scoreId}`, {
      criteriaScores: JSON.stringify(updated.criteriaScores),
      totalScore: updated.totalScore.toString(),
      bonusPoints: updated.bonusPoints?.toString() || '',
      penaltyPoints: updated.penaltyPoints?.toString() || '',
      notes: updated.notes || '',
      updatedAt: updated.updatedAt?.toISOString() || new Date().toISOString(),
      editHistory: JSON.stringify(updated.editHistory),
    });
  });

  return success ? updated : null;
}

/**
 * Получить оценку по ID
 */
export async function getScoreById(scoreId: string): Promise<Score | null> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${SCORES_KEY_PREFIX}${scoreId}`);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      // Safe JSON.parse with fallbacks
      let criteriaScores: Record<string, number | boolean | string> = {};
      let editHistory: ScoreEdit[] = [];
      
      try {
        criteriaScores = JSON.parse(data.criteriaScores);
      } catch {
        console.warn(`Invalid criteriaScores JSON for score ${scoreId}`);
      }
      
      try {
        editHistory = JSON.parse(data.editHistory || '[]') as ScoreEdit[];
      } catch {
        console.warn(`Invalid editHistory JSON for score ${scoreId}`);
      }

      return {
        id: data.id,
        eventId: data.eventId,
        contestId: data.contestId,
        teamId: data.teamId || undefined,
        participantId: data.participantId || undefined,
        juryId: data.juryId,
        criteriaScores,
        totalScore: parseFloat(data.totalScore) || 0,
        bonusPoints: data.bonusPoints ? parseFloat(data.bonusPoints) : undefined,
        penaltyPoints: data.penaltyPoints ? parseFloat(data.penaltyPoints) : undefined,
        notes: data.notes || undefined,
        submittedAt: new Date(data.submittedAt),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
        editHistory,
      };
    },
    null
  );
}

/**
 * Получить все оценки конкурса
 */
export async function getScoresByContestId(contestId: string): Promise<Score[]> {
  return safeRedisOperation(
    async (redis) => {
      const scoreIds = await redis.sMembers(`${CONTEST_SCORES_KEY_PREFIX}${contestId}`);

      if (scoreIds.length === 0) {
        return [];
      }

      const scores = await Promise.all(scoreIds.map((id: string) => getScoreById(id)));

      return scores.filter((s): s is Score => s !== null);
    },
    []
  );
}

/**
 * Получить оценки жюри
 */
export async function getScoresByJuryId(juryId: string): Promise<Score[]> {
  return safeRedisOperation(
    async (redis) => {
      const scoreIds = await redis.sMembers(`${JURY_SCORES_KEY_PREFIX}${juryId}`);

      if (scoreIds.length === 0) {
        return [];
      }

      const scores = await Promise.all(scoreIds.map((id: string) => getScoreById(id)));

      return scores.filter((s): s is Score => s !== null);
    },
    []
  );
}

/**
 * Получить все оценки мероприятия (для сертификатов)
 * Оптимизировано: использует event:scores индекс вместо SCAN
 */
export async function getScoresByEventId(eventId: string): Promise<AggregatedScore[]> {
  return safeRedisOperation(
    async (redis) => {
      // Использовать индекс event:scores вместо SCAN по всем ключам
      const scoreIds = await redis.sMembers(`${EVENT_SCORES_KEY_PREFIX}${eventId}`);
      
      if (scoreIds.length === 0) {
        return [];
      }

      // Batch загрузка оценок
      const eventScores = (await Promise.all(
        scoreIds.map((id: string) => getScoreById(id))
      )).filter((s): s is Score => s !== null);

      // Группировать по contestId и teamId/participantId
      // Используем разделитель ||| который не встречается в UUID
      const SEPARATOR = '|||';
      const grouped = new Map<string, Score[]>();
      
      for (const score of eventScores) {
        const key = `${score.contestId}${SEPARATOR}${score.teamId || score.participantId}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(score);
      }

      // Вычислить агрегированные оценки
      const aggregated: AggregatedScore[] = [];
      
      for (const [key, scores] of grouped.entries()) {
        const separatorIndex = key.indexOf(SEPARATOR);
        const contestId = key.substring(0, separatorIndex);
        const entityId = key.substring(separatorIndex + SEPARATOR.length);
        const isTeam = scores[0].teamId !== undefined;
        
        // Защита от NaN при пустом массиве (хотя grouped гарантирует непустой)
        const totalSum = scores.reduce((sum: number, s: Score) => sum + s.totalScore, 0);
        const averageScore = scores.length > 0 ? totalSum / scores.length : 0;
        
        const juryScores = scores.map((s: Score) => ({
          juryId: s.juryId,
          juryName: s.juryId,
          score: s.totalScore,
        }));
        
        aggregated.push({
          eventId,
          contestId,
          teamId: isTeam ? entityId : undefined,
          participantId: !isTeam ? entityId : undefined,
          averageScore,
          juryScores,
          completedAt: new Date(),
        });
      }

      return aggregated;
    },
    []
  );
}

/**
 * Получить все индивидуальные оценки мероприятия (для массового ввода)
 * Оптимизировано: использует event:scores индекс вместо SCAN
 */
export async function getAllScoresByEventId(eventId: string): Promise<Score[]> {
  return safeRedisOperation(
    async (redis) => {
      // Использовать индекс event:scores вместо SCAN по всем ключам
      const scoreIds = await redis.sMembers(`${EVENT_SCORES_KEY_PREFIX}${eventId}`);
      
      if (scoreIds.length === 0) {
        return [];
      }

      // Batch загрузка оценок
      const scores = await Promise.all(
        scoreIds.map((id: string) => getScoreById(id))
      );

      return scores.filter((s): s is Score => s !== null);
    },
    []
  );
}

/**
 * Вычислить агрегированную оценку (среднее по жюри)
 */
export async function calculateAggregatedScore(
  contestId: string,
  teamId?: string,
  participantId?: string
): Promise<AggregatedScore | null> {
  const allScores = await getScoresByContestId(contestId);

  // Фильтровать оценки для конкретной команды/участника
  const relevantScores = allScores.filter((s) => {
    if (teamId) return s.teamId === teamId;
    if (participantId) return s.participantId === participantId;
    return false;
  });

  if (relevantScores.length === 0) {
    return null;
  }

  // Вычислить среднее
  const totalSum = relevantScores.reduce((sum, s) => sum + s.totalScore, 0);
  const averageScore = totalSum / relevantScores.length;

  // Получить информацию о жюри (нужно будет расширить для получения имён)
  const juryScores = relevantScores.map((s) => ({
    juryId: s.juryId,
    juryName: s.juryId, // NOTE: Имя жюри загружается на уровне UI из juryService
    score: s.totalScore,
  }));

  const contest = await getContestById(contestId);

  return {
    eventId: contest?.eventId || '',
    contestId,
    teamId,
    participantId,
    averageScore,
    juryScores,
    completedAt: new Date(),
  };
}
