/**
 * Server Actions для управления конкурсами
 * 
 * Requirements: 1.6, 2.1, 2.3, 2.4
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as contestService from '@/services/contestService';
import {
  CreateContestSchema,
  UpdateContestSchema,
  ReorderContestsSchema,
  type CreateContestInput,
  type UpdateContestInput,
} from '@/lib/validation';
import type { Contest } from '@/types';

/**
 * Создать новый конкурс
 * Доступно: Admin, Event_Manager (только своё мероприятие)
 */
export async function createContest(
  input: CreateContestInput,
  csrfToken: string
): Promise<{ success: true; data: Contest } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Проверка авторизации с проверкой доступа к мероприятию
    await checkPermission(['Admin', 'Event_Manager'], input.eventId);

    // Валидация входных данных
    const validated = CreateContestSchema.parse(input);

    // Создание конкурса
    const contest = await contestService.createContest(validated);

    // Инвалидация кэша
    revalidateTag(`event:${input.eventId}:contests`);
    revalidateTag(`event:${input.eventId}`);

    return { success: true, data: contest };
  } catch (error) {
    console.error('Failed to create contest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить конкурс
 * Доступно: Admin, Event_Manager (только своё мероприятие)
 */
export async function updateContest(
  contestId: string,
  input: UpdateContestInput,
  csrfToken: string
): Promise<{ success: true; data: Contest } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Получить конкурс чтобы узнать eventId
    const existing = await contestService.getContestById(contestId);
    if (!existing) {
      return { success: false, error: 'Конкурс не найден' };
    }

    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager'], existing.eventId);

    // Валидация входных данных
    const validated = UpdateContestSchema.parse({ ...input, id: contestId });

    // Обновление конкурса
    const contest = await contestService.updateContest(contestId, validated);

    if (!contest) {
      return { success: false, error: 'Конкурс не найден' };
    }

    // Инвалидация кэша
    revalidateTag(`event:${existing.eventId}:contests`);
    revalidateTag(`contest:${contestId}`);

    return { success: true, data: contest };
  } catch (error) {
    console.error('Failed to update contest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Изменить порядок конкурсов
 * Доступно: Admin, Event_Manager (только своё мероприятие)
 */
export async function reorderContests(
  eventId: string,
  contestOrders: Array<{ contestId: string; order: number }>,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    // Валидация входных данных
    ReorderContestsSchema.parse({ eventId, contestOrders });

    // Изменение порядка
    await contestService.reorderContests(eventId, contestOrders);

    // Инвалидация кэша
    revalidateTag(`event:${eventId}:contests`);

    return { success: true };
  } catch (error) {
    console.error('Failed to reorder contests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить конкурс
 * Доступно: Admin, Event_Manager (только своё мероприятие)
 */
export async function deleteContest(
  contestId: string,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // CSRF защита
    await validateCSRFToken(csrfToken);

    // Получить конкурс чтобы узнать eventId
    const existing = await contestService.getContestById(contestId);
    if (!existing) {
      return { success: false, error: 'Конкурс не найден' };
    }

    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager'], existing.eventId);

    // Удаление конкурса
    const deleted = await contestService.deleteContest(contestId);

    if (!deleted) {
      return { success: false, error: 'Конкурс не найден' };
    }

    // Инвалидация кэша
    revalidateTag(`event:${existing.eventId}:contests`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete contest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить все конкурсы мероприятия
 * Доступно: все авторизованные пользователи
 */
export async function getContests(
  eventId: string
): Promise<{ success: true; data: Contest[] } | { success: false; error: string }> {
  try {
    // Проверка авторизации
    await checkPermission(['Admin', 'Event_Manager', 'Jury'], eventId);

    const contests = await contestService.getContestsByEventId(eventId);

    return { success: true, data: contests };
  } catch (error) {
    console.error('Failed to get contests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить конкурс по ID
 * Доступно: все авторизованные пользователи
 */
export async function getContest(
  contestId: string
): Promise<{ success: true; data: Contest } | { success: false; error: string }> {
  try {
    const contest = await contestService.getContestById(contestId);

    if (!contest) {
      return { success: false, error: 'Конкурс не найден' };
    }

    // Проверка авторизации с проверкой доступа к конкурсу
    await checkPermission(['Admin', 'Event_Manager', 'Jury'], contest.eventId, contestId);

    return { success: true, data: contest };
  } catch (error) {
    console.error('Failed to get contest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
