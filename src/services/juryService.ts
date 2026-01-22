/**
 * JuryService - управление жюри
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { getRedisClient } from '@/lib/redis';
import { safeRedisOperation, safeRedisWrite } from '@/lib/redis-wrapper';
import { atomicCreateWithIndex, atomicDeleteWithIndex } from '@/lib/redis-transactions';
import type { JuryMember, JuryAssignment } from '@/types';
import { randomUUID } from 'node:crypto';

const JURY_KEY_PREFIX = 'jury:';
const JURY_LIST_KEY = 'jury:all';
const JURY_ASSIGNMENT_KEY_PREFIX = 'jury:assignment:';
const EVENT_JURY_KEY_PREFIX = 'event:jury:';

/**
 * Создать нового члена жюри
 */
export async function createJuryMember(data: {
  firstName: string;
  lastName: string;
  middleName?: string;
  title: string;
  institution?: string;
  contactEmail?: string;
}): Promise<JuryMember> {
  const jury: JuryMember = {
    id: randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    middleName: data.middleName,
    title: data.title,
    institution: data.institution,
    contactEmail: data.contactEmail,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const success = await atomicCreateWithIndex(
    `${JURY_KEY_PREFIX}${jury.id}`,
    {
      id: jury.id,
      firstName: jury.firstName,
      lastName: jury.lastName,
      middleName: jury.middleName || '',
      title: jury.title,
      institution: jury.institution || '',
      contactEmail: jury.contactEmail || '',
      isActive: jury.isActive.toString(),
      createdAt: jury.createdAt.toISOString(),
      updatedAt: jury.updatedAt.toISOString(),
    },
    JURY_LIST_KEY,
    jury.id
  );

  if (!success) {
    throw new Error('Не удалось создать члена жюри');
  }

  return jury;
}

/**
 * Получить члена жюри по ID
 */
export async function getJuryMemberById(juryId: string): Promise<JuryMember | null> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${JURY_KEY_PREFIX}${juryId}`);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || undefined,
        title: data.title,
        institution: data.institution || undefined,
        contactEmail: data.contactEmail || undefined,
        isActive: data.isActive === 'true',
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    },
    null
  );
}

/**
 * Получить всех членов жюри
 */
export async function getAllJuryMembers(): Promise<JuryMember[]> {
  return safeRedisOperation(
    async (redis) => {
      const juryIds = await redis.sMembers(JURY_LIST_KEY);

      if (juryIds.length === 0) {
        return [];
      }

      const juryMembers = await Promise.all(juryIds.map((id: string) => getJuryMemberById(id)));

      return juryMembers.filter((j): j is JuryMember => j !== null);
    },
    []
  );
}

/**
 * Получить активных членов жюри
 */
export async function getActiveJuryMembers(): Promise<JuryMember[]> {
  const allJury = await getAllJuryMembers();
  return allJury.filter((j) => j.isActive);
}

/**
 * Обновить члена жюри
 */
export async function updateJuryMember(
  juryId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    middleName: string;
    title: string;
    institution: string;
    contactEmail: string;
    isActive: boolean;
  }>
): Promise<JuryMember | null> {
  const existing = await getJuryMemberById(juryId);
  if (!existing) {
    return null;
  }

  const updated: JuryMember = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };

  const updateData: Record<string, string> = {
    updatedAt: updated.updatedAt.toISOString(),
  };

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.middleName !== undefined) updateData.middleName = data.middleName;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.institution !== undefined) updateData.institution = data.institution;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.isActive !== undefined) updateData.isActive = data.isActive.toString();

  const success = await safeRedisWrite(async (redis) => {
    await redis.hSet(`${JURY_KEY_PREFIX}${juryId}`, updateData);
  });

  return success ? updated : null;
}

/**
 * Деактивировать члена жюри (сохраняет оценки)
 */
export async function deactivateJuryMember(juryId: string): Promise<JuryMember | null> {
  return updateJuryMember(juryId, { isActive: false });
}

/**
 * Назначить жюри на мероприятие и конкурсы
 */
export async function assignJuryToEvent(
  juryId: string,
  eventId: string,
  contestIds: string[],
  assignedBy: string
): Promise<JuryAssignment> {
  // Проверить что жюри существует и активен
  const jury = await getJuryMemberById(juryId);
  if (!jury) {
    throw new Error('Член жюри не найден');
  }
  if (!jury.isActive) {
    throw new Error('Нельзя назначить деактивированного члена жюри');
  }

  const assignment: JuryAssignment = {
    id: randomUUID(),
    juryId,
    eventId,
    contestIds,
    assignedAt: new Date(),
    assignedBy,
  };

  const success = await atomicCreateWithIndex(
    `${JURY_ASSIGNMENT_KEY_PREFIX}${assignment.id}`,
    {
      id: assignment.id,
      juryId: assignment.juryId,
      eventId: assignment.eventId,
      contestIds: JSON.stringify(assignment.contestIds),
      assignedAt: assignment.assignedAt.toISOString(),
      assignedBy: assignment.assignedBy,
    },
    `${EVENT_JURY_KEY_PREFIX}${eventId}`,
    assignment.id
  );

  if (!success) {
    throw new Error('Не удалось назначить жюри');
  }

  return assignment;
}

/**
 * Получить назначения жюри для мероприятия
 */
export async function getJuryAssignmentsByEventId(eventId: string): Promise<JuryAssignment[]> {
  return safeRedisOperation(
    async (redis) => {
      const assignmentIds = await redis.sMembers(`${EVENT_JURY_KEY_PREFIX}${eventId}`);

      if (assignmentIds.length === 0) {
        return [];
      }

      const assignments = await Promise.all(
        assignmentIds.map(async (id: string) => {
          const data = await redis.hGetAll(`${JURY_ASSIGNMENT_KEY_PREFIX}${id}`);

          if (!data || Object.keys(data).length === 0) {
            return null;
          }

          // Безопасный парсинг JSON
          let contestIds: string[] = [];
          try {
            contestIds = JSON.parse(data.contestIds) as string[];
          } catch {
            console.error(`Invalid contestIds JSON for assignment ${id}`);
            contestIds = [];
          }

          return {
            id: data.id,
            juryId: data.juryId,
            eventId: data.eventId,
            contestIds,
            assignedAt: new Date(data.assignedAt),
            assignedBy: data.assignedBy,
          };
        })
      );

      return assignments.filter((a): a is JuryAssignment => a !== null);
    },
    []
  );
}

/**
 * Получить назначения конкретного жюри
 * Использует SCAN вместо KEYS для безопасности
 */
export async function getJuryAssignmentsByJuryId(juryId: string): Promise<JuryAssignment[]> {
  return safeRedisOperation(
    async (redis) => {
      const allAssignmentIds: string[] = [];
      
      // Использовать SCAN вместо KEYS
      for await (const key of redis.scanIterator({
        MATCH: `${JURY_ASSIGNMENT_KEY_PREFIX}*`,
        COUNT: 100,
      })) {
        allAssignmentIds.push(key);
      }

      const assignments = await Promise.all(
        allAssignmentIds.map(async (key: string) => {
          const data = await redis.hGetAll(key);

          if (!data || Object.keys(data).length === 0 || data.juryId !== juryId) {
            return null;
          }

          // Безопасный парсинг JSON
          let contestIds: string[] = [];
          try {
            contestIds = JSON.parse(data.contestIds) as string[];
          } catch {
            console.error(`Invalid contestIds JSON for assignment ${key}`);
            contestIds = [];
          }

          return {
            id: data.id,
            juryId: data.juryId,
            eventId: data.eventId,
            contestIds,
            assignedAt: new Date(data.assignedAt),
            assignedBy: data.assignedBy,
          };
        })
      );

      return assignments.filter((a): a is JuryAssignment => a !== null);
    },
    []
  );
}

/**
 * Проверить имеет ли жюри доступ к конкурсу
 */
export async function hasJuryAccessToContest(
  juryId: string,
  contestId: string
): Promise<boolean> {
  const assignments = await getJuryAssignmentsByJuryId(juryId);

  return assignments.some((a) => a.contestIds.includes(contestId));
}

/**
 * Удалить назначение жюри
 */
export async function removeJuryAssignment(assignmentId: string): Promise<boolean> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${JURY_ASSIGNMENT_KEY_PREFIX}${assignmentId}`);
      
      if (!data || Object.keys(data).length === 0) {
        return false;
      }

      const eventId = data.eventId;
      
      // Удалить из индекса мероприятия
      await redis.sRem(`${EVENT_JURY_KEY_PREFIX}${eventId}`, assignmentId);
      
      // Удалить само назначение
      await redis.del(`${JURY_ASSIGNMENT_KEY_PREFIX}${assignmentId}`);
      
      return true;
    },
    false
  );
}

/**
 * Обновить назначение жюри (изменить конкурсы)
 */
export async function updateJuryAssignment(
  assignmentId: string,
  contestIds: string[]
): Promise<JuryAssignment | null> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${JURY_ASSIGNMENT_KEY_PREFIX}${assignmentId}`);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      await redis.hSet(`${JURY_ASSIGNMENT_KEY_PREFIX}${assignmentId}`, {
        contestIds: JSON.stringify(contestIds),
      });

      return {
        id: data.id,
        juryId: data.juryId,
        eventId: data.eventId,
        contestIds,
        assignedAt: new Date(data.assignedAt),
        assignedBy: data.assignedBy,
      };
    },
    null
  );
}
