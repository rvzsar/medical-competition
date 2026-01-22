/**
 * Data Access Layer (DAL)
 * 
 * Централизованная авторизация для Server Actions и Route Handlers.
 * Использует React cache() для дедупликации запросов сессии в рамках одного рендера.
 * 
 * Requirements: 9.1, 9.2
 */

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from './session';

/**
 * Роли пользователей в системе
 */
export type UserRole = 'Admin' | 'Event_Manager' | 'Jury';

/**
 * Интерфейс сессии пользователя
 */
export interface Session {
  userId: string;
  username: string;
  role: UserRole;
  eventId?: string; // Для Event_Manager и Jury - привязка к мероприятию
  contestIds?: string[]; // Для Jury - список доступных конкурсов
  juryId?: string; // ID члена жюри из JURY_MEMBERS (для Jury)
  expiresAt: Date;
}

/**
 * Проверить и получить текущую сессию
 * Кэшируется через React cache() для дедупликации в рамках одного рендера
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  const sessionData = await getSession();

  if (!sessionData) {
    return null;
  }

  // Проверка срока действия
  if (sessionData.expiresAt < Date.now()) {
    return null;
  }

  return {
    userId: sessionData.userId,
    username: sessionData.username,
    role: sessionData.role,
    eventId: sessionData.eventId,
    contestIds: sessionData.contestIds,
    juryId: sessionData.juryMemberId, // Маппинг juryMemberId -> juryId для обратной совместимости
    expiresAt: new Date(sessionData.expiresAt),
  };
});

/**
 * Проверить права доступа пользователя
 * 
 * @param allowedRoles - Список разрешённых ролей
 * @param eventId - ID мероприятия (опционально, для проверки привязки)
 * @param contestId - ID конкурса (опционально, для проверки доступа жюри)
 * @returns Session если доступ разрешён
 * @throws Error если доступ запрещён
 */
export async function checkPermission(
  allowedRoles: UserRole[],
  eventId?: string,
  contestId?: string
): Promise<Session> {
  const session = await verifySession();

  if (!session) {
    throw new Error('Unauthorized: No valid session');
  }

  // Проверка роли
  if (!allowedRoles.includes(session.role)) {
    throw new Error(
      `Forbidden: Required roles [${allowedRoles.join(', ')}], got ${session.role}`
    );
  }

  // Проверка привязки к мероприятию для Event_Manager и Jury
  if (eventId && session.role !== 'Admin') {
    if (session.eventId !== eventId) {
      throw new Error(
        `Forbidden: User not assigned to event ${eventId}`
      );
    }
  }

  // Проверка доступа к конкурсу для Jury
  if (contestId && session.role === 'Jury') {
    if (!session.contestIds?.includes(contestId)) {
      throw new Error(
        `Forbidden: Jury not assigned to contest ${contestId}`
      );
    }
  }

  return session;
}

/**
 * Требовать аутентификацию для страницы
 * Редиректит на /login если сессия невалидна
 * 
 * @param allowedRoles - Список разрешённых ролей (опционально)
 * @returns Session
 */
export async function requireAuth(
  allowedRoles?: UserRole[]
): Promise<Session> {
  const session = await verifySession();

  if (!session) {
    redirect('/login');
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // Редирект на главную если роль не подходит
    redirect('/');
  }

  return session;
}

/**
 * Проверить является ли пользователь администратором
 */
export async function isAdmin(): Promise<boolean> {
  const session = await verifySession();
  return session?.role === 'Admin';
}

/**
 * Проверить имеет ли пользователь доступ к мероприятию
 */
export async function hasEventAccess(eventId: string): Promise<boolean> {
  const session = await verifySession();
  
  if (!session) return false;
  if (session.role === 'Admin') return true;
  
  return session.eventId === eventId;
}

/**
 * Проверить имеет ли пользователь доступ к конкурсу
 */
export async function hasContestAccess(contestId: string): Promise<boolean> {
  const session = await verifySession();
  
  if (!session) return false;
  if (session.role === 'Admin') return true;
  if (session.role === 'Event_Manager') return true; // Event Manager видит все конкурсы своего мероприятия
  
  return session.contestIds?.includes(contestId) ?? false;
}
