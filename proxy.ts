/**
 * Proxy (Next.js 16 replacement for middleware.ts)
 * 
 * Выполняет оптимистичные проверки сессии для защищённых маршрутов.
 * Не выполняет тяжёлые операции - только проверка наличия cookie.
 * Полная авторизация выполняется в DAL на уровне Server Actions.
 * 
 * Requirements: 9.3, 9.4, 9.5
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Proxy function для защиты маршрутов
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Защита admin маршрутов
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Оптимистичная проверка - не декодируем сессию здесь
    // Полная проверка роли будет в DAL
  }

  // Защита scoring маршрутов (/contests/*)
  if (pathname.startsWith('/contests/')) {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Защита results маршрутов (если требуется авторизация)
  // Сейчас results публичные, но можно добавить проверку
  // if (pathname.startsWith('/results')) {
  //   const sessionCookie = request.cookies.get('session');
  //   if (!sessionCookie?.value) {
  //     const url = request.nextUrl.clone();
  //     url.pathname = '/login';
  //     url.searchParams.set('redirect', pathname);
  //     return NextResponse.redirect(url);
  //   }
  // }

  return NextResponse.next();
}

/**
 * Конфигурация matcher для proxy
 * Определяет какие маршруты обрабатываются proxy
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/contests/:path*',
    // '/results/:path*', // Раскомментировать если results требуют авторизации
  ],
};
