/**
 * Безопасная обёртка для Redis операций
 * 
 * Предоставляет:
 * - Автоматический retry с exponential backoff
 * - Fallback значения при ошибках
 * - Graceful degradation
 * - Логирование ошибок
 * 
 * Requirements: 8.4
 */

import { getRedisClient } from './redis';
import type { RedisClientType } from 'redis';

/**
 * Безопасное выполнение Redis операции с retry и fallback
 * 
 * @param operation - Функция выполняющая операцию с Redis
 * @param fallback - Значение возвращаемое при ошибке
 * @param retries - Количество попыток (по умолчанию 3)
 * @returns Результат операции или fallback
 */
export async function safeRedisOperation<T>(
  operation: (client: RedisClientType) => Promise<T>,
  fallback: T,
  retries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await getRedisClient();
      return await operation(client);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `Redis operation failed (attempt ${attempt}/${retries}):`,
        errorMessage
      );

      // NOTE: В production использовать Sentry.captureException(error, { tags: { attempt, retries } });

      if (attempt === retries) {
        // Последняя попытка - вернуть fallback
        console.error('Redis operation failed after all retries, using fallback');
        return fallback;
      }

      // Exponential backoff перед retry
      const delay = Math.pow(2, attempt) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return fallback;
}

/**
 * Безопасное выполнение операции записи в Redis
 * 
 * @param operation - Функция выполняющая запись
 * @param retries - Количество попыток (по умолчанию 3)
 * @returns true если успешно, false если ошибка
 */
export async function safeRedisWrite(
  operation: (client: RedisClientType) => Promise<void>,
  retries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await getRedisClient();
      await operation(client);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `Redis write failed (attempt ${attempt}/${retries}):`,
        errorMessage
      );

      // NOTE: В production использовать Sentry.captureException(error, { tags: { attempt, retries, operation: 'write' } });

      if (attempt === retries) {
        console.error('Redis write failed after all retries');
        return false;
      }

      // Exponential backoff перед retry
      const delay = Math.pow(2, attempt) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
}

/**
 * Безопасное выполнение batch операций
 * 
 * @param operations - Массив операций для выполнения
 * @param fallback - Значение возвращаемое при ошибке
 * @returns Массив результатов или fallback
 */
export async function safeBatchOperation<T>(
  operations: Array<(client: RedisClientType) => Promise<T>>,
  fallback: T[]
): Promise<T[]> {
  try {
    const client = await getRedisClient();
    return await Promise.all(operations.map((op) => op(client)));
  } catch (error) {
    console.error('Batch operation failed:', error);
    // NOTE: В production использовать Sentry.captureException(error)
    return fallback;
  }
}

/**
 * Проверить доступность Redis
 * 
 * @returns true если Redis доступен
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Безопасное получение значения по ключу
 * 
 * @param key - Ключ Redis
 * @param fallback - Значение по умолчанию при ошибке
 * @returns Значение или fallback
 */
export async function safeGet(
  key: string,
  fallback: string | null
): Promise<string | null> {
  return safeRedisOperation(
    async (client) => client.get(key),
    fallback
  );
}

/**
 * Безопасная установка значения по ключу
 * 
 * @param key - Ключ Redis
 * @param value - Значение для сохранения
 * @param ttlSeconds - Время жизни в секундах (опционально)
 * @returns true если успешно
 */
export async function safeSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  return safeRedisWrite(async (client) => {
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  });
}
