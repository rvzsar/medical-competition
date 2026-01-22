/**
 * Server Actions для управления жюри
 * 
 * Requirements: 4.2, 4.3
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as juryService from '@/services/juryService';
import {
  CreateJuryMemberSchema,
  UpdateJuryMemberSchema,
  AssignJurySchema,
  type CreateJuryMemberInput,
  type UpdateJuryMemberInput,
  type AssignJuryInput,
} from '@/lib/validation';
import type { JuryMember, JuryAssignment } from '@/types';

/**
 * Создать нового члена жюри
 */
export async function createJuryMember(
  input: CreateJuryMemberInput,
  csrfToken: string
): Promise<{ success: true; data: JuryMember } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin']);

    const validated = CreateJuryMemberSchema.parse(input);
    const jury = await juryService.createJuryMember(validated);

    revalidateTag('jury');

    return { success: true, data: jury };
  } catch (error) {
    console.error('Failed to create jury member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить члена жюри
 */
export async function updateJuryMember(
  juryId: string,
  input: UpdateJuryMemberInput,
  csrfToken: string
): Promise<{ success: true; data: JuryMember } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin']);

    const validated = UpdateJuryMemberSchema.parse({ ...input, id: juryId });
    const jury = await juryService.updateJuryMember(juryId, validated);

    if (!jury) {
      return { success: false, error: 'Член жюри не найден' };
    }

    revalidateTag('jury');
    revalidateTag(`jury:${juryId}`);

    return { success: true, data: jury };
  } catch (error) {
    console.error('Failed to update jury member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Деактивировать члена жюри
 */
export async function deactivateJuryMember(
  juryId: string,
  csrfToken: string
): Promise<{ success: true; data: JuryMember } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin']);

    const jury = await juryService.deactivateJuryMember(juryId);

    if (!jury) {
      return { success: false, error: 'Член жюри не найден' };
    }

    revalidateTag('jury');
    revalidateTag(`jury:${juryId}`);

    return { success: true, data: jury };
  } catch (error) {
    console.error('Failed to deactivate jury member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Назначить жюри на мероприятие
 */
export async function assignJuryToEvent(
  input: AssignJuryInput,
  csrfToken: string
): Promise<{ success: true; data: JuryAssignment } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    const session = await checkPermission(['Admin', 'Event_Manager'], input.eventId);

    const validated = AssignJurySchema.parse(input);
    const assignment = await juryService.assignJuryToEvent(
      validated.juryId,
      validated.eventId,
      validated.contestIds,
      session.userId
    );

    revalidateTag(`event:${input.eventId}:jury`);

    return { success: true, data: assignment };
  } catch (error) {
    console.error('Failed to assign jury:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить всех членов жюри
 */
export async function getJuryMembers(): Promise<
  { success: true; data: JuryMember[] } | { success: false; error: string }
> {
  try {
    await checkPermission(['Admin', 'Event_Manager']);

    const jury = await juryService.getAllJuryMembers();

    return { success: true, data: jury };
  } catch (error) {
    console.error('Failed to get jury members:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить назначения жюри для мероприятия
 */
export async function getEventJuryAssignments(
  eventId: string
): Promise<{ success: true; data: JuryAssignment[] } | { success: false; error: string }> {
  try {
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    const assignments = await juryService.getJuryAssignmentsByEventId(eventId);

    return { success: true, data: assignments };
  } catch (error) {
    console.error('Failed to get jury assignments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить назначение жюри
 */
export async function removeJuryAssignment(
  assignmentId: string,
  eventId: string,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    const result = await juryService.removeJuryAssignment(assignmentId);

    if (!result) {
      return { success: false, error: 'Назначение не найдено' };
    }

    revalidateTag(`event:${eventId}:jury`);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove jury assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить назначение жюри (изменить конкурсы)
 */
export async function updateJuryAssignment(
  assignmentId: string,
  eventId: string,
  contestIds: string[],
  csrfToken: string
): Promise<{ success: true; data: JuryAssignment } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    if (contestIds.length === 0) {
      return { success: false, error: 'Выберите хотя бы один конкурс' };
    }

    const assignment = await juryService.updateJuryAssignment(assignmentId, contestIds);

    if (!assignment) {
      return { success: false, error: 'Назначение не найдено' };
    }

    revalidateTag(`event:${eventId}:jury`);

    return { success: true, data: assignment };
  } catch (error) {
    console.error('Failed to update jury assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
