/**
 * API Authentication Helper
 * 
 * Утилиты для проверки аутентификации в API routes.
 * 
 * Requirements: 9.1, 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptSessionFromCookie, SessionData, SESSION_COOKIE_NAME } from './session';
import type { UserRole } from './dal';

export interface AuthResult {
  success: true;
  session: SessionData;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

/**
 * Проверить аутентификацию в API route
 * 
 * @param request - NextRequest
 * @param allowedRoles - Список разрешённых ролей (опционально)
 * @returns AuthResult или AuthError
 */
export function checkApiAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): AuthResult | AuthError {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return {
      success: false,
      error: 'Unauthorized: No session',
      status: 401,
    };
  }

  const session = decryptSessionFromCookie(sessionCookie.value);
  
  if (!session) {
    return {
      success: false,
      error: 'Unauthorized: Invalid or expired session',
      status: 401,
    };
  }

  // Проверка роли если указана
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      success: false,
      error: `Forbidden: Required roles [${allowedRoles.join(', ')}]`,
      status: 403,
    };
  }

  return {
    success: true,
    session,
  };
}

/**
 * Создать JSON response с ошибкой
 */
export function authErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json(
    { error: error.error },
    { status: error.status }
  );
}

/**
 * Wrapper для API route с проверкой аутентификации
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, ['Admin', 'Jury'], async (session) => {
 *     // Ваш код здесь
 *     return NextResponse.json({ data: 'ok' });
 *   });
 * }
 */
export async function withAuth(
  request: NextRequest,
  allowedRoles: UserRole[] | null,
  handler: (session: SessionData) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = checkApiAuth(request, allowedRoles || undefined);
  
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  return handler(authResult.session);
}

/**
 * Получить ID пользователя из сессии (для обратной совместимости)
 * Возвращает juryMemberId если есть, иначе oderId
 */
export function getUserIdFromSession(session: SessionData): string {
  return session.juryMemberId || session.userId;
}
