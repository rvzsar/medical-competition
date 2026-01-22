/**
 * ContestService - управление конкурсами
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { getRedisClient } from '@/lib/redis';
import { safeRedisOperation, safeRedisWrite } from '@/lib/redis-wrapper';
import { atomicCreateWithIndex, atomicDeleteWithIndex } from '@/lib/redis-transactions';
import type { Contest, Criteria } from '@/types';
import { randomUUID } from 'node:crypto';
import { canEditEventStructure } from './eventService';

const CONTESTS_KEY_PREFIX = 'contest:';
const EVENT_CONTESTS_KEY_PREFIX = 'event:contests:';

/**
 * Создать новый конкурс
 */
export async function createContest(data: {
  eventId: string;
  name: string;
  description?: string;
  order: number;
  parentContestId?: string;
  criteria: Criteria[];
  timeLimit?: number;
}): Promise<Contest> {
  // Проверка что мероприятие в статусе draft
  const canEdit = await canEditEventStructure(data.eventId);
  if (!canEdit) {
    throw new Error('Нельзя изменять структуру активного мероприятия');
  }

  // Вычислить maxScore из критериев
  const maxScore = data.criteria.reduce((sum, c) => {
    if (c.type === 'numeric' && c.maxValue !== undefined) {
      return sum + c.maxValue * (c.weight || 1);
    }
    return sum;
  }, 0);

  const contest: Contest = {
    id: randomUUID(),
    eventId: data.eventId,
    name: data.name,
    description: data.description,
    order: data.order,
    parentContestId: data.parentContestId,
    criteria: data.criteria,
    maxScore,
    timeLimit: data.timeLimit,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Атомарное сохранение в Redis
  const success = await atomicCreateWithIndex(
    `${CONTESTS_KEY_PREFIX}${contest.id}`,
    {
      id: contest.id,
      eventId: contest.eventId,
      name: contest.name,
      description: contest.description || '',
      order: contest.order.toString(),
      parentContestId: contest.parentContestId || '',
      criteria: JSON.stringify(contest.criteria),
      maxScore: contest.maxScore?.toString() || '',
      timeLimit: contest.timeLimit?.toString() || '',
      createdAt: contest.createdAt.toISOString(),
      updatedAt: contest.updatedAt.toISOString(),
    },
    `${EVENT_CONTESTS_KEY_PREFIX}${data.eventId}`,
    contest.id
  );

  if (!success) {
    throw new Error('Не удалось создать конкурс');
  }

  return contest;
}

/**
 * Получить конкурс по ID
 */
export async function getContestById(contestId: string): Promise<Contest | null> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${CONTESTS_KEY_PREFIX}${contestId}`);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      // Safe JSON.parse with fallback
      let criteria: Criteria[] = [];
      try {
        criteria = JSON.parse(data.criteria) as Criteria[];
      } catch {
        console.warn(`Invalid criteria JSON for contest ${contestId}`);
      }

      return {
        id: data.id,
        eventId: data.eventId,
        name: data.name,
        description: data.description || undefined,
        order: parseInt(data.order, 10) || 0,
        parentContestId: data.parentContestId || undefined,
        criteria,
        maxScore: data.maxScore ? parseFloat(data.maxScore) : undefined,
        timeLimit: data.timeLimit ? parseInt(data.timeLimit, 10) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    },
    null
  );
}

/**
 * Получить все конкурсы мероприятия
 */
export async function getContestsByEventId(eventId: string): Promise<Contest[]> {
  return safeRedisOperation(
    async (redis) => {
      const contestIds = await redis.sMembers(`${EVENT_CONTESTS_KEY_PREFIX}${eventId}`);

      if (contestIds.length === 0) {
        return [];
      }

      const contests = await Promise.all(contestIds.map((id: string) => getContestById(id)));

      return contests
        .filter((c): c is Contest => c !== null)
        .sort((a: Contest, b: Contest) => a.order - b.order);
    },
    []
  );
}

/**
 * Получить вложенные конкурсы (станции)
 */
export async function getNestedContests(parentContestId: string): Promise<Contest[]> {
  const parent = await getContestById(parentContestId);
  if (!parent) {
    return [];
  }

  const allContests = await getContestsByEventId(parent.eventId);
  return allContests
    .filter((c) => c.parentContestId === parentContestId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Обновить конкурс
 */
export async function updateContest(
  contestId: string,
  data: Partial<{
    name: string;
    description: string;
    criteria: Criteria[];
    timeLimit: number;
  }>
): Promise<Contest | null> {
  const existing = await getContestById(contestId);
  if (!existing) {
    return null;
  }

  // Проверка что мероприятие в статусе draft
  const canEdit = await canEditEventStructure(existing.eventId);
  if (!canEdit) {
    throw new Error('Нельзя изменять структуру активного мероприятия');
  }

  // Пересчитать maxScore если изменились критерии
  let maxScore = existing.maxScore;
  if (data.criteria) {
    maxScore = data.criteria.reduce((sum, c) => {
      if (c.type === 'numeric' && c.maxValue !== undefined) {
        return sum + c.maxValue * (c.weight || 1);
      }
      return sum;
    }, 0);
  }

  const updated: Contest = {
    ...existing,
    ...data,
    maxScore,
    updatedAt: new Date(),
  };

  const success = await safeRedisWrite(async (redis) => {
    await redis.hSet(`${CONTESTS_KEY_PREFIX}${contestId}`, {
      name: updated.name,
      description: updated.description || '',
      criteria: JSON.stringify(updated.criteria),
      maxScore: updated.maxScore?.toString() || '',
      timeLimit: updated.timeLimit?.toString() || '',
      updatedAt: updated.updatedAt.toISOString(),
    });
  });

  return success ? updated : null;
}

/**
 * Изменить порядок конкурсов
 */
export async function reorderContests(
  eventId: string,
  contestOrders: Array<{ contestId: string; order: number }>
): Promise<void> {
  // Проверка что мероприятие в статусе draft
  const canEdit = await canEditEventStructure(eventId);
  if (!canEdit) {
    throw new Error('Нельзя изменять структуру активного мероприятия');
  }

  // Обновить порядок для каждого конкурса
  await Promise.all(
    contestOrders.map(async ({ contestId, order }) => {
      await safeRedisWrite(async (redis) => {
        await redis.hSet(`${CONTESTS_KEY_PREFIX}${contestId}`, {
          order: order.toString(),
          updatedAt: new Date().toISOString(),
        });
      });
    })
  );
}

/**
 * Удалить конкурс
 */
export async function deleteContest(contestId: string): Promise<boolean> {
  const existing = await getContestById(contestId);
  if (!existing) {
    return false;
  }

  // Проверка что мероприятие в статусе draft
  const canEdit = await canEditEventStructure(existing.eventId);
  if (!canEdit) {
    throw new Error('Нельзя удалять конкурсы активного мероприятия');
  }

  // Проверка на вложенные конкурсы
  const nested = await getNestedContests(contestId);
  if (nested.length > 0) {
    throw new Error('Нельзя удалить конкурс с вложенными станциями');
  }

  // Проверить наличие оценок - если есть, удаление запрещено
  // NOTE: Проверка выполняется через canEditEventStructure (активное мероприятие = есть оценки)

  // Атомарное удаление конкурса
  return atomicDeleteWithIndex(
    `${CONTESTS_KEY_PREFIX}${contestId}`,
    `${EVENT_CONTESTS_KEY_PREFIX}${existing.eventId}`,
    contestId
  );
}
