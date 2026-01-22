/**
 * Server Actions для управления участниками
 * 
 * Requirements: 3.1, 3.5
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as participantService from '@/services/participantService';
import {
  CreateParticipantSchema,
  UpdateParticipantSchema,
  type CreateParticipantInput,
  type UpdateParticipantInput,
} from '@/lib/validation';
import type { Participant } from '@/types';

/**
 * Создать нового участника
 */
export async function createParticipant(
  input: CreateParticipantInput,
  csrfToken: string
): Promise<{ success: true; data: Participant } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin', 'Event_Manager'], input.eventId);

    const validated = CreateParticipantSchema.parse(input);
    const participant = await participantService.createParticipant(validated);

    revalidateTag(`event:${input.eventId}:participants`);

    return { success: true, data: participant };
  } catch (error) {
    console.error('Failed to create participant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить участника
 */
export async function updateParticipant(
  participantId: string,
  input: UpdateParticipantInput,
  csrfToken: string
): Promise<{ success: true; data: Participant } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    
    const existing = await participantService.getParticipantById(participantId);
    if (!existing) {
      return { success: false, error: 'Участник не найден' };
    }

    await checkPermission(['Admin', 'Event_Manager'], existing.eventId);

    const validated = UpdateParticipantSchema.parse({ ...input, id: participantId });
    const participant = await participantService.updateParticipant(participantId, validated);

    if (!participant) {
      return { success: false, error: 'Участник не найден' };
    }

    revalidateTag(`event:${existing.eventId}:participants`);
    revalidateTag(`participant:${participantId}`);

    return { success: true, data: participant };
  } catch (error) {
    console.error('Failed to update participant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить участника
 */
export async function deleteParticipant(
  participantId: string,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    
    const existing = await participantService.getParticipantById(participantId);
    if (!existing) {
      return { success: false, error: 'Участник не найден' };
    }

    await checkPermission(['Admin', 'Event_Manager'], existing.eventId);

    const deleted = await participantService.deleteParticipant(participantId);

    if (!deleted) {
      return { success: false, error: 'Участник не найден' };
    }

    revalidateTag(`event:${existing.eventId}:participants`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete participant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить всех участников мероприятия
 */
export async function getParticipants(
  eventId: string
): Promise<{ success: true; data: Participant[] } | { success: false; error: string }> {
  try {
    await checkPermission(['Admin', 'Event_Manager', 'Jury'], eventId);

    const participants = await participantService.getParticipantsByEventId(eventId);

    return { success: true, data: participants };
  } catch (error) {
    console.error('Failed to get participants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Импорт участников из CSV
 */
export async function importParticipants(
  eventId: string,
  csvContent: string
): Promise<
  | { success: true; data: { success: number; failed: number; errors: string[] } }
  | { success: false; error: string }
> {
  try {
    await checkPermission(['Admin', 'Event_Manager'], eventId);

    const result = await participantService.importParticipantsFromCSV(eventId, csvContent);

    revalidateTag(`event:${eventId}:participants`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to import participants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
