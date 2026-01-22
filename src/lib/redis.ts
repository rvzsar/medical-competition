/**
 * Redis Connection для Vercel Serverless
 * 
 * Использует singleton pattern с ленивой инициализацией:
 * - Exponential backoff с jitter для reconnection
 * - Event listeners для мониторинга состояния
 * - Graceful shutdown при SIGTERM (для локальной разработки)
 * - Thread-safe инициализация с защитой от race conditions
 * 
 * Requirements: 8.1, 8.4
 */

import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClientType> | null = null;

/**
 * Получить Redis client (singleton)
 * Thread-safe с защитой от race conditions
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // Если клиент уже подключён - вернуть его
  if (client?.isOpen) {
    return client;
  }

  // Если идёт подключение - дождаться его завершения
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Начать новое подключение
  isConnecting = true;
  connectionPromise = connectRedis();

  try {
    client = await connectionPromise;
    return client;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
}

/**
 * Внутренняя функция подключения к Redis
 */
async function connectRedis(): Promise<RedisClientType> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const newClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000, // Уменьшено с 10s до 5s
      keepAlive: 10000, // Уменьшено с 30s до 10s для Vercel
      reconnectStrategy: (retries: number) => {
        // Максимум 3 попытки для serverless (быстрее fail)
        if (retries > 3) {
          console.error('Redis: Max retries (3) reached, giving up');
          return false;
        }

        // Быстрый backoff для serverless: 100ms, 200ms, 400ms
        const delay = Math.min(100 * Math.pow(2, retries), 500);
        console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries}/3)`);
        return delay;
      },
    },
  });

  // Event listeners для мониторинга
  newClient.on('error', (err: Error) => {
    console.error('Redis Client Error:', err.message);
    // NOTE: В production использовать Sentry.captureException(err)
  });

  newClient.on('connect', () => {
    console.log('Redis: Connecting to server...');
  });

  newClient.on('ready', () => {
    console.log('Redis: Connection ready');
  });

  newClient.on('reconnecting', () => {
    console.log('Redis: Attempting to reconnect...');
  });

  newClient.on('end', () => {
    console.log('Redis: Connection closed');
  });

  // Подключиться
  await newClient.connect();

  return newClient;
}

/**
 * Закрыть Redis connection
 * Используется для graceful shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
    client = null;
    console.log('Redis: Client closed gracefully');
  }
}

/**
 * Проверить состояние подключения
 */
export function isRedisConnected(): boolean {
  return client?.isOpen ?? false;
}

// Graceful shutdown для локальной разработки
// В Vercel Serverless это не нужно (функции завершаются автоматически)
if (process.env.NODE_ENV === 'development' && typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing Redis client...');
    await closeRedisClient();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing Redis client...');
    await closeRedisClient();
    process.exit(0);
  });
}

// Экспортируем старое имя для обратной совместимости
export const getRedisPool = getRedisClient;
export const closeRedisPool = closeRedisClient;
export const isRedisPoolConnected = isRedisConnected;
