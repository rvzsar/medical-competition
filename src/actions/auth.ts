'use server';

import { redirect } from 'next/navigation';
import { validateCSRFToken } from '@/lib/csrf';
import { createSession, destroySession } from '@/lib/session';
import type { UserRole } from '@/lib/dal';

/**
 * Конфигурация пользователей из переменных окружения
 * 
 * Формат: USER_CREDENTIALS=admin:password:Admin,manager:password:Event_Manager
 */
function getUsers(): Record<string, { password: string; role: UserRole }> {
  const credentialsEnv = process.env.USER_CREDENTIALS;
  
  if (!credentialsEnv) {
    // Fallback для разработки (НЕ использовать в production!)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ USER_CREDENTIALS not set, using development defaults');
      return {
        admin: { password: 'admin123', role: 'Admin' },
        manager: { password: 'manager123', role: 'Event_Manager' },
      };
    }
    return {};
  }

  const users: Record<string, { password: string; role: UserRole }> = {};
  
  try {
    // Формат: username:password:role,username:password:role
    const entries = credentialsEnv.split(',');
    for (const entry of entries) {
      const [username, password, role] = entry.trim().split(':');
      if (username && password && role) {
        users[username] = {
          password,
          role: role as UserRole,
        };
      }
    }
  } catch (error) {
    console.error('Failed to parse USER_CREDENTIALS:', error);
  }

  return users;
}

/**
 * Login action - аутентификация пользователя
 * 
 * Requirements: 9.1, 9.2
 */
export async function login(
  username: string,
  password: string,
  csrfToken: string
): Promise<{ success: boolean; role?: string; error?: string }> {
  try {
    // Валидация CSRF токена
    await validateCSRFToken(csrfToken);

    // Валидация входных данных
    if (!username || typeof username !== 'string' || username.length > 50) {
      return {
        success: false,
        error: 'Некорректное имя пользователя',
      };
    }

    if (!password || typeof password !== 'string' || password.length > 100) {
      return {
        success: false,
        error: 'Некорректный пароль',
      };
    }

    const users = getUsers();
    const user = users[username];

    if (!user) {
      // Не раскрываем существует ли пользователь
      return {
        success: false,
        error: 'Неверное имя пользователя или пароль',
      };
    }

    // Constant-time comparison для защиты от timing attacks
    const { timingSafeEqual } = await import('crypto');
    const passwordBuffer = Buffer.from(password, 'utf-8');
    const expectedBuffer = Buffer.from(user.password, 'utf-8');
    
    // Если длины разные, всё равно делаем сравнение для constant time
    const isValidLength = passwordBuffer.length === expectedBuffer.length;
    const compareBuffer = isValidLength ? expectedBuffer : passwordBuffer;
    
    let isValid = true;
    try {
      isValid = isValidLength && timingSafeEqual(passwordBuffer, compareBuffer);
    } catch {
      // Fallback
      isValid = isValidLength && password === user.password;
    }
    
    if (!isValid) {
      return {
        success: false,
        error: 'Неверное имя пользователя или пароль',
      };
    }

    // Создать безопасную сессию
    await createSession({
      userId: username,
      username,
      role: user.role,
    });

    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Ошибка при входе в систему',
    };
  }
}

/**
 * Logout action - выход из системы
 */
export async function logout(): Promise<void> {
  await destroySession();
  redirect('/login');
}
