/**
 * API Route: Logout
 * 
 * Выход из системы - удаление сессии.
 * 
 * Requirements: 9.1
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Удалить cookie сессии
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

// GET метод удалён - logout должен быть только POST для защиты от CSRF
// Ссылки на logout должны использовать форму с POST методом
