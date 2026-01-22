/**
 * CSRF Protection (Server-side only)
 * Защита от Cross-Site Request Forgery атак
 * 
 * Этот модуль используется только на сервере (Server Actions, API Routes)
 */

import { cookies } from 'next/headers';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'change-me-in-production-use-random-32-bytes';
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Генерация CSRF токена (только для Server Actions/API)
 */
export async function generateCSRFToken(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
  
  const csrfToken = `${token}.${signature}`;
  
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return csrfToken;
}

/**
 * Constant-time string comparison
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
  } catch {
    return false;
  }
}

/**
 * Валидация CSRF токена
 */
export async function validateCSRFToken(token: string | null | undefined): Promise<void> {
  if (!token) {
    throw new Error('CSRF token missing');
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (!cookieToken || !safeCompare(cookieToken, token)) {
    throw new Error('CSRF token invalid');
  }

  const [tokenPart, signature] = token.split('.');
  if (!tokenPart || !signature) {
    throw new Error('CSRF token malformed');
  }

  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(tokenPart)
    .digest('hex');
  
  if (!safeCompare(signature, expectedSignature)) {
    throw new Error('CSRF token signature invalid');
  }
}
