/**
 * CSRF Protection (Server-side only)
 * Защита от Cross-Site Request Forgery атак
 * 
 * В Next.js 15 cookies можно модифицировать только в Server Actions/Route Handlers.
 * Поэтому используем stateless CSRF токены с HMAC подписью.
 */

import { createHmac, timingSafeEqual } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'change-me-in-production-use-random-32-bytes';

/**
 * Генерация CSRF токена (stateless - без cookies)
 * Токен содержит timestamp и HMAC подпись
 */
export async function generateCSRFToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(timestamp)
    .digest('hex');
  
  return `${timestamp}.${signature}`;
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
 * Валидация CSRF токена (stateless)
 * Проверяет HMAC подпись и срок действия (24 часа)
 */
export async function validateCSRFToken(token: string | null | undefined): Promise<void> {
  if (!token) {
    throw new Error('CSRF token missing');
  }

  const [timestamp, signature] = token.split('.');
  if (!timestamp || !signature) {
    throw new Error('CSRF token malformed');
  }

  // Проверить подпись
  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(timestamp)
    .digest('hex');
  
  if (!safeCompare(signature, expectedSignature)) {
    throw new Error('CSRF token signature invalid');
  }

  // Проверить срок действия (24 часа)
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
  
  if (isNaN(tokenTime) || now - tokenTime > maxAge) {
    throw new Error('CSRF token expired');
  }
}
