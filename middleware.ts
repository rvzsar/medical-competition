/**
 * Next.js Middleware
 * 
 * Проверяет аутентификацию для защищённых маршрутов.
 * Использует HMAC-подписанные сессии.
 * 
 * Requirements: 9.1, 9.2
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const SESSION_COOKIE_NAME = 'session';

/**
 * Подписать данные с HMAC
 */
function signData(data: string): string {
  const hmac = createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Проверить подпись (constant-time)
 */
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = signData(data);
  
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  try {
    return timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Расшифровать и проверить сессию
 */
function decryptSession(encrypted: string): { userId: string; role: string; expiresAt: number } | null {
  try {
    const parts = encrypted.split('.');
    if (parts.length !== 2) {
      return null;
    }
    
    const [signature, encoded] = parts;
    
    if (!verifySignature(encoded, signature)) {
      return null;
    }
    
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    const data = JSON.parse(json);
    
    // Проверить срок действия
    if (data.expiresAt && data.expiresAt < Date.now()) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Защищённые маршруты
  if (pathname.startsWith('/admin') || pathname.startsWith('/scoring')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const session = decryptSession(sessionCookie.value);
    
    if (!session) {
      // Невалидная или истёкшая сессия
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      // Удалить невалидный cookie
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Проверка роли для admin маршрутов
    if (pathname.startsWith('/admin')) {
      const allowedRoles = ['Admin', 'Event_Manager', 'Jury'];
      if (!allowedRoles.includes(session.role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/scoring/:path*'],
};
