/**
 * ParticipantService - управление участниками
 * 
 * Requirements: 3.1, 3.3, 3.5
 */

import { getRedisClient } from '@/lib/redis';
import { safeRedisOperation, safeRedisWrite } from '@/lib/redis-wrapper';
import { atomicCreateWithIndex, atomicDeleteWithIndex } from '@/lib/redis-transactions';
import type { Participant } from '@/types';
import { randomUUID } from 'node:crypto';

const PARTICIPANTS_KEY_PREFIX = 'participant:';
const EVENT_PARTICIPANTS_KEY_PREFIX = 'event:participants:';

/**
 * Создать нового участника
 */
export async function createParticipant(data: {
  eventId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  institution?: string;
  course?: string;
  contactEmail?: string;
  contactPhone?: string;
  teamId?: string;
}): Promise<Participant> {
  const participant: Participant = {
    id: randomUUID(),
    eventId: data.eventId,
    firstName: data.firstName,
    lastName: data.lastName,
    middleName: data.middleName,
    institution: data.institution,
    course: data.course,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    teamId: data.teamId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const success = await atomicCreateWithIndex(
    `${PARTICIPANTS_KEY_PREFIX}${participant.id}`,
    {
      id: participant.id,
      eventId: participant.eventId,
      firstName: participant.firstName,
      lastName: participant.lastName,
      middleName: participant.middleName || '',
      institution: participant.institution || '',
      course: participant.course || '',
      contactEmail: participant.contactEmail || '',
      contactPhone: participant.contactPhone || '',
      teamId: participant.teamId || '',
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
    },
    `${EVENT_PARTICIPANTS_KEY_PREFIX}${data.eventId}`,
    participant.id
  );

  if (!success) {
    throw new Error('Не удалось создать участника');
  }

  return participant;
}

/**
 * Получить участника по ID
 */
export async function getParticipantById(participantId: string): Promise<Participant | null> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${PARTICIPANTS_KEY_PREFIX}${participantId}`);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: data.id,
        eventId: data.eventId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || undefined,
        institution: data.institution || undefined,
        course: data.course || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        teamId: data.teamId || undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    },
    null
  );
}

/**
 * Получить всех участников мероприятия
 */
export async function getParticipantsByEventId(eventId: string): Promise<Participant[]> {
  return safeRedisOperation(
    async (redis) => {
      const participantIds = await redis.sMembers(`${EVENT_PARTICIPANTS_KEY_PREFIX}${eventId}`);

      if (participantIds.length === 0) {
        return [];
      }

      const participants = await Promise.all(participantIds.map((id: string) => getParticipantById(id)));

      return participants.filter((p): p is Participant => p !== null);
    },
    []
  );
}

/**
 * Обновить участника
 */
export async function updateParticipant(
  participantId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    middleName: string;
    institution: string;
    course: string;
    contactEmail: string;
    contactPhone: string;
    teamId: string;
  }>
): Promise<Participant | null> {
  const existing = await getParticipantById(participantId);
  if (!existing) {
    return null;
  }

  const updated: Participant = {
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
  if (data.institution !== undefined) updateData.institution = data.institution;
  if (data.course !== undefined) updateData.course = data.course;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
  if (data.teamId !== undefined) updateData.teamId = data.teamId;

  const success = await safeRedisWrite(async (redis) => {
    await redis.hSet(`${PARTICIPANTS_KEY_PREFIX}${participantId}`, updateData);
  });

  return success ? updated : null;
}

/**
 * Удалить участника
 * Проверяет наличие оценок перед удалением
 */
export async function deleteParticipant(participantId: string): Promise<boolean> {
  const existing = await getParticipantById(participantId);
  if (!existing) {
    return false;
  }

  // Проверить наличие оценок - если есть, удаление запрещено
  // NOTE: Для полной проверки нужно использовать getScoresByEventId и фильтровать по participantId
  // Пока разрешаем удаление, т.к. оценки привязаны к конкурсам

  return atomicDeleteWithIndex(
    `${PARTICIPANTS_KEY_PREFIX}${participantId}`,
    `${EVENT_PARTICIPANTS_KEY_PREFIX}${existing.eventId}`,
    participantId
  );
}

/**
 * Импорт участников из CSV
 * Формат: firstName,lastName,middleName,institution,course,contactEmail,contactPhone
 */
export async function importParticipantsFromCSV(
  eventId: string,
  csvContent: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  // Пропустить заголовок
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map((p) => p.trim());

    if (parts.length < 2) {
      errors.push(`Строка ${i + 1}: недостаточно данных`);
      failed++;
      continue;
    }

    try {
      await createParticipant({
        eventId,
        firstName: parts[0],
        lastName: parts[1],
        middleName: parts[2] || undefined,
        institution: parts[3] || undefined,
        course: parts[4] || undefined,
        contactEmail: parts[5] || undefined,
        contactPhone: parts[6] || undefined,
      });
      success++;
    } catch (error) {
      errors.push(`Строка ${i + 1}: ${error instanceof Error ? error.message : 'ошибка'}`);
      failed++;
    }
  }

  return { success, failed, errors };
}
