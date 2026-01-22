/**
 * Server Actions для управления командами
 * 
 * Requirements: 3.1
 */

'use server';

import { revalidateTag } from 'next/cache';
import { checkPermission } from '@/lib/dal';
import { validateCSRFToken } from '@/lib/csrf';
import * as teamService from '@/services/teamService';
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
} from '@/lib/validation';
import type { Team } from '@/types';

/**
 * Создать новую команду
 */
export async function createTeam(
  input: CreateTeamInput,
  csrfToken: string
): Promise<{ success: true; data: Team } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    await checkPermission(['Admin', 'Event_Manager'], input.eventId);

    const validated = CreateTeamSchema.parse(input);
    const team = await teamService.createTeam(validated);

    revalidateTag(`event:${input.eventId}:teams`);

    return { success: true, data: team };
  } catch (error) {
    console.error('Failed to create team:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Обновить команду
 */
export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput,
  csrfToken: string
): Promise<{ success: true; data: Team } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    
    const existing = await teamService.getTeamById(teamId);
    if (!existing) {
      return { success: false, error: 'Команда не найдена' };
    }

    await checkPermission(['Admin', 'Event_Manager'], existing.eventId);

    const validated = UpdateTeamSchema.parse({ ...input, id: teamId });
    const team = await teamService.updateTeam(teamId, validated);

    if (!team) {
      return { success: false, error: 'Команда не найдена' };
    }

    revalidateTag(`event:${existing.eventId}:teams`);
    revalidateTag(`team:${teamId}`);

    return { success: true, data: team };
  } catch (error) {
    console.error('Failed to update team:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Удалить команду
 */
export async function deleteTeam(
  teamId: string,
  csrfToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await validateCSRFToken(csrfToken);
    
    const existing = await teamService.getTeamById(teamId);
    if (!existing) {
      return { success: false, error: 'Команда не найдена' };
    }

    await checkPermission(['Admin', 'Event_Manager'], existing.eventId);

    const deleted = await teamService.deleteTeam(teamId);

    if (!deleted) {
      return { success: false, error: 'Команда не найдена' };
    }

    revalidateTag(`event:${existing.eventId}:teams`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete team:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Получить все команды мероприятия
 */
export async function getTeams(
  eventId: string
): Promise<{ success: true; data: Team[] } | { success: false; error: string }> {
  try {
    await checkPermission(['Admin', 'Event_Manager', 'Jury'], eventId);

    const teams = await teamService.getTeamsByEventId(eventId);

    return { success: true, data: teams };
  } catch (error) {
    console.error('Failed to get teams:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
