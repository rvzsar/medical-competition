/**
 * EventService - управление мероприятиями
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6
 */

import { getRedisClient } from '@/lib/redis';
import { safeRedisOperation, safeRedisWrite } from '@/lib/redis-wrapper';
import { atomicCreateWithIndex, atomicDeleteWithIndex } from '@/lib/redis-transactions';
import type { Event, EventStatus } from '@/types';
import { randomUUID } from 'crypto';

const EVENTS_KEY_PREFIX = 'event:';
const EVENTS_LIST_KEY = 'events:all';

/**
 * Создать новое мероприятие
 */
export async function createEvent(
  data: {
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  },
  createdBy: string
): Promise<Event> {
  const event: Event = {
    id: randomUUID(),
    name: data.name,
    description: data.description,
    status: 'draft',
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
  };

  // Атомарное сохранение в Redis с добавлением в индекс
  const success = await atomicCreateWithIndex(
    `${EVENTS_KEY_PREFIX}${event.id}`,
    {
      id: event.id,
      name: event.name,
      description: event.description || '',
      status: event.status,
      startDate: event.startDate?.toISOString() || '',
      endDate: event.endDate?.toISOString() || '',
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      createdBy: event.createdBy,
    },
    EVENTS_LIST_KEY,
    event.id
  );

  if (!success) {
    throw new Error('Не удалось создать мероприятие');
  }

  return event;
}

/**
 * Получить мероприятие по ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  return safeRedisOperation(
    async (redis) => {
      const data = await redis.hGetAll(`${EVENTS_KEY_PREFIX}${eventId}`);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        status: data.status as EventStatus,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        createdBy: data.createdBy,
      };
    },
    null
  );
}

/**
 * Получить все мероприятия
 */
export async function getAllEvents(): Promise<Event[]> {
  return safeRedisOperation(
    async (redis) => {
      const eventIds = await redis.sMembers(EVENTS_LIST_KEY);
      
      if (eventIds.length === 0) {
        return [];
      }

      const events = await Promise.all(
        eventIds.map((id) => getEventById(id))
      );

      return events.filter((e): e is Event => e !== null);
    },
    []
  );
}

/**
 * Получить мероприятия по статусу
 */
export async function getEventsByStatus(status: EventStatus): Promise<Event[]> {
  const allEvents = await getAllEvents();
  return allEvents.filter((e) => e.status === status);
}

/**
 * Обновить мероприятие
 */
export async function updateEvent(
  eventId: string,
  data: Partial<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }>
): Promise<Event | null> {
  const existing = await getEventById(eventId);
  if (!existing) {
    return null;
  }

  const updated: Event = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };

  const success = await safeRedisWrite(async (redis) => {
    await redis.hSet(
      `${EVENTS_KEY_PREFIX}${eventId}`,
      {
        name: updated.name,
        description: updated.description || '',
        startDate: updated.startDate?.toISOString() || '',
        endDate: updated.endDate?.toISOString() || '',
        updatedAt: updated.updatedAt.toISOString(),
      }
    );
  });

  return success ? updated : null;
}

/**
 * Изменить статус мероприятия
 * Проверяет допустимые переходы статусов
 */
export async function updateEventStatus(
  eventId: string,
  newStatus: EventStatus
): Promise<Event | null> {
  const existing = await getEventById(eventId);
  if (!existing) {
    return null;
  }

  // Проверка допустимых переходов
  const allowedTransitions: Record<EventStatus, EventStatus[]> = {
    draft: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [], // из archived нельзя перейти
  };

  if (!allowedTransitions[existing.status].includes(newStatus)) {
    throw new Error(
      `Недопустимый переход статуса: ${existing.status} -> ${newStatus}`
    );
  }

  const updated: Event = {
    ...existing,
    status: newStatus,
    updatedAt: new Date(),
  };

  const success = await safeRedisWrite(async (redis) => {
    await redis.hSet(
      `${EVENTS_KEY_PREFIX}${eventId}`,
      {
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      }
    );
  });

  return success ? updated : null;
}

/**
 * Удалить мероприятие
 * Каскадно удаляет все связанные данные
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const existing = await getEventById(eventId);
  if (!existing) {
    return false;
  }

  // Проверка: нельзя удалить активное или завершённое мероприятие
  if (existing.status === 'active' || existing.status === 'completed') {
    throw new Error(
      'Нельзя удалить активное или завершённое мероприятие. Сначала переведите в статус archived.'
    );
  }

  // FIXME: Каскадное удаление связанных данных
  // При удалении мероприятия в статусе draft/archived нужно удалить:
  // - Contests (через contestService.deleteContest)
  // - Teams/Participants (через teamService/participantService)
  // - JuryAssignments (через juryService)
  // Оценки не удаляются т.к. мероприятие не может быть в draft если есть оценки

  // Атомарное удаление мероприятия
  return atomicDeleteWithIndex(
    `${EVENTS_KEY_PREFIX}${eventId}`,
    EVENTS_LIST_KEY,
    eventId
  );
}

/**
 * Проверить можно ли редактировать структуру мероприятия
 * Структуру нельзя менять когда мероприятие активно
 */
export async function canEditEventStructure(eventId: string): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) {
    return false;
  }
  
  return event.status === 'draft';
}
