/**
 * API Route: Login
 * 
 * Аутентификация членов жюри по ID и PIN.
 * Создаёт безопасную HMAC-подписанную сессию.
 * 
 * Requirements: 9.1, 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { JURY_MEMBERS } from '@/config/juryMembers';
import { 
  encryptSessionData, 
  getSessionCookieOptions, 
  SESSION_COOKIE_NAME 
} from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit-redis';

function getClientIP(request: NextRequest): string {
  // Vercel/Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (Redis-based)
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, RATE_LIMITS.LOGIN);
    
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Слишком много попыток входа. Попробуйте позже.',
          retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { juryId, accessPin } = body;

    // Валидация входных данных
    if (!juryId || typeof juryId !== 'string') {
      return NextResponse.json(
        { error: 'juryId обязателен' },
        { status: 400 }
      );
    }

    if (!accessPin || typeof accessPin !== 'string') {
      return NextResponse.json(
        { error: 'PIN обязателен' },
        { status: 400 }
      );
    }

    // Проверка члена жюри
    const jury = JURY_MEMBERS.find((j) => j.id === juryId);
    if (!jury) {
      return NextResponse.json(
        { error: 'Неверный выбор члена жюри' },
        { status: 400 }
      );
    }

    if (!jury.isActive) {
      return NextResponse.json(
        { error: 'Этот член жюри неактивен' },
        { status: 403 }
      );
    }

    // Проверка PIN (из переменной окружения)
    const expectedPin = process.env.JURY_ACCESS_PIN;
    if (!expectedPin) {
      console.error('JURY_ACCESS_PIN not configured');
      return NextResponse.json(
        { error: 'Система не настроена. Обратитесь к администратору.' },
        { status: 500 }
      );
    }

    // Constant-time comparison для защиты от timing attacks
    const pinBuffer = Buffer.from(accessPin, 'utf-8');
    const expectedBuffer = Buffer.from(expectedPin, 'utf-8');
    
    // Если длины разные, всё равно делаем сравнение для constant time
    const isValidLength = pinBuffer.length === expectedBuffer.length;
    const compareBuffer = isValidLength ? expectedBuffer : pinBuffer;
    
    let isValid = true;
    try {
      const { timingSafeEqual } = await import('crypto');
      isValid = isValidLength && timingSafeEqual(pinBuffer, compareBuffer);
    } catch {
      // Fallback если timingSafeEqual недоступен
      isValid = isValidLength && accessPin === expectedPin;
    }
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный PIN' },
        { status: 401 }
      );
    }

    // Создать безопасную сессию
    const juryFullName = `${jury.lastName} ${jury.firstName}${jury.middleName ? ' ' + jury.middleName : ''}`;
    const sessionData = encryptSessionData({
      userId: `jury-${jury.id}`,
      username: juryFullName,
      role: 'Jury',
      juryMemberId: jury.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: jury.id,
        name: juryFullName,
        role: 'Jury',
      },
    });

    // Установить cookie с сессией
    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(SESSION_COOKIE_NAME, sessionData, cookieOptions);

    return response;
  } catch (error) {
    console.error('Auth login error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
