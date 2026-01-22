/**
 * Server Actions для управления мероприятиями
 * 
 * Requirements: 1.1, 1.2, 1.3, 9.3
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as eventService from '@/services/eventService';
import { logEntityCreated, logAction } from '@/services/auditLogService';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventStatusSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from '@/lib/validation';
import type { Event, EventStatus } from '@/types';

/**
 * Создать новое мероприятие
 * Доступно: Admin, Event_Manager
 */
export async function createEvent(
  input: CreateEventInput,
  csrfToken: string
): Promise<{ success: true; data: Event } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Проверка авторизации
    const session = await checkPermission(['Admin', 'Event_Manager']);

    // Валидация входных данных
    const validated = CreateEventSchema.parse(input);

    // Создание мероприятия
    const event = await eventService.createEvent(validated, session.userId);

    // Логируем создание
    await logEntityCreated(
      { id: session.userId, name: session.username || 'Unknown', role: session.role },
      'event',
      event.id,
      event.name
    );

    // Инвалидация кэша
    revalidateTag('events');

    return { success: true, data: event };
  } catch (error) {
    console.error('Failed to create event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить мероприятие
 * Доступно: Admin, Event_Manager (только своё мероприятие)
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  csrfToken: string
): Promise<{ success: true; data: Event } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Проверка авторизации с проверкой доступа к мероприятию
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    // Валидация входных данных
    const validated = UpdateEventSchema.parse(input);

    // Обновление мероприятия
    const event = await eventService.updateEvent(eventId, validated);

    if (!event) {
      return { success: false, error: 'Мероприятие не найдено' };
    }

    // Инвалидация кэша
    revalidateTag('events');
    revalidateTag(`event:${eventId}`);

    return { success: true, data: event };
  } catch (error) {
    console.error('Failed to update event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Изменить статус мероприятия
 * Доступно: Admin, Event_Manager (только своё мероприятие)
 */
export async function updateEventStatus(
  eventId: string,
  newStatus: EventStatus,
  csrfToken: string
): Promise<{ success: true; data: Event } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    // Валидация статуса
    EventStatusSchema.parse(newStatus);

    // Изменение статуса
    const event = await eventService.updateEventStatus(eventId, newStatus);

    if (!event) {
      return { success: false, error: 'Мероприятие не найдено' };
    }

    // Инвалидация кэша
    revalidateTag('events');
    revalidateTag(`event:${eventId}`);

    return { success: true, data: event };
  } catch (error) {
    console.error('Failed to update event status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить мероприятие
 * Доступно: только Admin
 */
export async function deleteEvent(
  eventId: string,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Проверка авторизации (только Admin)
    const session = await checkPermission(['Admin']);

    // Получаем информацию о мероприятии для лога
    const event = await eventService.getEventById(eventId);

    // Удаление мероприятия
    const deleted = await eventService.deleteEvent(eventId);

    if (!deleted) {
      return { success: false, error: 'Мероприятие не найдено' };
    }

    // Логируем удаление
    await logAction(
      'event_deleted',
      { id: session.userId, name: session.username || 'Unknown', role: session.role },
      { entityId: eventId, entityName: event?.name || 'Unknown', entityType: 'event' }
    );

    // Инвалидация кэша
    revalidateTag('events');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить все мероприятия
 * Доступно: все авторизованные пользователи
 */
export async function getEvents(): Promise<
  { success: true; data: Event[] } | { success: false; error: string }
> {
  try {
    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager', 'Jury']);

    const events = await eventService.getAllEvents();

    return { success: true, data: events };
  } catch (error) {
    console.error('Failed to get events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить мероприятие по ID
 * Доступно: все авторизованные пользователи
 */
export async function getEvent(
  eventId: string
): Promise<{ success: true; data: Event } | { success: false; error: string }> {
  try {
    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager', 'Jury'], eventId);

    const event = await eventService.getEventById(eventId);

    if (!event) {
      return { success: false, error: 'Мероприятие не найдено' };
    }

    return { success: true, data: event };
  } catch (error) {
    console.error('Failed to get event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
