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
      connectTimeout: 10000,
      keepAlive: 30000,
      reconnectStrategy: (retries: number) => {
        // Максимум 10 попыток переподключения
        if (retries > 10) {
          console.error('Redis: Max retries (10) reached, giving up');
          return false;
        }

        // Exponential backoff: 2^retries * 50ms, максимум 3000ms
        const baseDelay = Math.min(Math.pow(2, retries) * 50, 3000);
        
        // Добавляем jitter (случайное значение 0-200ms) для избежания thundering herd
        const jitter = Math.floor(Math.random() * 200);
        const delay = baseDelay + jitter;

        console.log(
          `Redis: Reconnecting in ${delay}ms (attempt ${retries}/10)`
        );

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
