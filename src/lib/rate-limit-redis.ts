/**
 * Redis-based Rate Limiter
 * 
 * Работает на всех инстансах Vercel (в отличие от in-memory).
 * Использует Redis INCR с TTL для подсчёта запросов.
 * 
 * Requirements: 9.3
 */

import { getRedisClient } from './redis';

export interface RateLimitConfig {
  /** Уникальный идентификатор лимита */
  key: string;
  /** Максимум запросов в окне */
  limit: number;
  /** Размер окна в секундах */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Проверить и обновить rate limit
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${RATE_LIMIT_PREFIX}${config.key}:${identifier}`;
  
  try {
    const redis = await getRedisClient();
    
    // Атомарно увеличить счётчик
    const count = await redis.incr(key);
    
    // Если это первый запрос - установить TTL
    if (count === 1) {
      await redis.expire(key, config.windowSeconds);
    }
    
    // Получить оставшееся время
    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);
    
    const remaining = Math.max(0, config.limit - count);
    const success = count <= config.limit;
    
    return { success, remaining, resetAt };
  } catch (error) {
    // При ошибке Redis - пропускаем (fail open)
    console.error('Rate limit check failed:', error);
    return {
      success: true,
      remaining: config.limit,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }
}

/**
 * Сбросить rate limit для идентификатора
 */
export async function resetRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${config.key}:${identifier}`;
  
  try {
    const redis = await getRedisClient();
    await redis.del(key);
  } catch (error) {
    console.error('Rate limit reset failed:', error);
  }
}

// Предустановленные конфигурации
export const RATE_LIMITS = {
  /** Login: 5 попыток за 15 минут */
  LOGIN: {
    key: 'login',
    limit: 5,
    windowSeconds: 15 * 60,
  },
  /** API: 100 запросов в минуту */
  API: {
    key: 'api',
    limit: 100,
    windowSeconds: 60,
  },
  /** Certificates: 10 генераций в минуту */
  CERTIFICATES: {
    key: 'certificates',
    limit: 10,
    windowSeconds: 60,
  },
  /** Scoring: 30 оценок в минуту */
  SCORING: {
    key: 'scoring',
    limit: 30,
    windowSeconds: 60,
  },
} as const;
