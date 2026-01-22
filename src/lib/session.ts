/**
 * Безопасная система сессий
 * 
 * Использует подписанные cookies с HMAC для защиты от подделки.
 * Альтернатива iron-session для случаев когда нужна простая реализация.
 * 
 * Requirements: 9.1, 9.2
 */

import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { UserRole } from './dal';

export interface SessionData {
  userId: string;
  username: string;
  role: UserRole;
  eventId?: string;
  contestIds?: string[];
  juryMemberId?: string; // ID члена жюри из JURY_MEMBERS
  expiresAt: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Экспортируем для использования в других модулях
export { SESSION_COOKIE_NAME, SESSION_SECRET };

/**
 * Подписать данные с HMAC
 */
function signData(data: string): string {
  const hmac = createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Проверить подпись данных (constant-time comparison)
 */
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = signData(data);
  
  // Constant-time comparison для защиты от timing attacks
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
 * Зашифровать и подписать session data
 */
function encryptSession(data: SessionData): string {
  const json = JSON.stringify(data);
  const encoded = Buffer.from(json, 'utf-8').toString('base64');
  const signature = signData(encoded);
  
  // Формат: signature.data
  return `${signature}.${encoded}`;
}

/**
 * Расшифровать и проверить session data
 */
function decryptSession(encrypted: string): SessionData | null {
  try {
    const parts = encrypted.split('.');
    if (parts.length !== 2) {
      return null;
    }
    
    const [signature, encoded] = parts;
    
    // Проверить подпись
    if (!verifySignature(encoded, signature)) {
      console.error('Session signature verification failed');
      return null;
    }
    
    // Декодировать данные
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    const data = JSON.parse(json) as SessionData;
    
    // Проверить срок действия
    if (data.expiresAt && data.expiresAt < Date.now()) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Session decryption failed:', error);
    return null;
  }
}

/**
 * Получить текущую сессию
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    return decryptSession(sessionCookie.value);
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Создать новую сессию
 */
export async function createSession(data: Omit<SessionData, 'expiresAt'>): Promise<void> {
  try {
    const sessionData: SessionData = {
      ...data,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    
    const encrypted = encryptSession(sessionData);
    
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // в секундах
      path: '/',
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Обновить существующую сессию
 */
export async function updateSession(updates: Partial<SessionData>): Promise<void> {
  try {
    const current = await getSession();
    if (!current) {
      throw new Error('No active session');
    }
    
    const updated: SessionData = {
      ...current,
      ...updates,
      expiresAt: Date.now() + SESSION_DURATION, // Продлить сессию
    };
    
    const encrypted = encryptSession(updated);
    
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    });
  } catch (error) {
    console.error('Failed to update session:', error);
    throw new Error('Failed to update session');
  }
}

/**
 * Уничтожить сессию
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('Failed to destroy session:', error);
  }
}

/**
 * Проверить валидность сессии
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Получить время до истечения сессии (в миллисекундах)
 */
export async function getSessionTimeRemaining(): Promise<number> {
  const session = await getSession();
  if (!session) {
    return 0;
  }
  
  return Math.max(0, session.expiresAt - Date.now());
}


/**
 * Расшифровать сессию из строки cookie (для middleware и API routes)
 * Эта функция не использует async cookies() и может быть вызвана синхронно
 */
export function decryptSessionFromCookie(cookieValue: string | undefined): SessionData | null {
  if (!cookieValue) {
    return null;
  }
  return decryptSession(cookieValue);
}

/**
 * Создать зашифрованную строку сессии (для API routes)
 */
export function encryptSessionData(data: Omit<SessionData, 'expiresAt'>): string {
  const sessionData: SessionData = {
    ...data,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  return encryptSession(sessionData);
}

/**
 * Получить параметры cookie для сессии
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  };
}
