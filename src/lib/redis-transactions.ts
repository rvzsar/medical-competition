/**
 * Redis транзакции для атомарных операций
 * 
 * Предотвращает race conditions через:
 * - MULTI/EXEC транзакции
 * - Атомарные операции
 * - Optimistic locking с WATCH
 * 
 * Requirements: 8.4
 */

import { getRedisClient } from './redis';

/**
 * Выполнить атомарную транзакцию в Redis
 * 
 * @param operations - Функция добавляющая команды в транзакцию
 * @returns true если транзакция успешна, false если ошибка
 */
export async function executeTransaction(
  operations: (multi: any) => void
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const multi = client.multi();

    operations(multi);

    const results = await multi.exec();
    return results !== null;
  } catch (error) {
    console.error('Transaction failed:', error);
    // NOTE: В production использовать Sentry.captureException(error)
    return false;
  }
}

/**
 * Атомарное создание записи с добавлением в индекс
 * 
 * @param hashKey - Ключ hash для данных
 * @param hashData - Данные для сохранения
 * @param indexKey - Ключ set для индекса
 * @param indexValue - Значение для добавления в индекс
 * @returns true если успешно
 */
export async function atomicCreateWithIndex(
  hashKey: string,
  hashData: Record<string, string>,
  indexKey: string,
  indexValue: string
): Promise<boolean> {
  return executeTransaction((multi) => {
    multi.hSet(hashKey, hashData);
    multi.sAdd(indexKey, indexValue);
  });
}

/**
 * Атомарное удаление записи с удалением из индекса
 * 
 * @param hashKey - Ключ hash для удаления
 * @param indexKey - Ключ set индекса
 * @param indexValue - Значение для удаления из индекса
 * @returns true если успешно
 */
export async function atomicDeleteWithIndex(
  hashKey: string,
  indexKey: string,
  indexValue: string
): Promise<boolean> {
  return executeTransaction((multi) => {
    multi.del(hashKey);
    multi.sRem(indexKey, indexValue);
  });
}

/**
 * Атомарное обновление с проверкой версии (optimistic locking)
 * 
 * @param key - Ключ для обновления
 * @param updateFn - Функция обновления значения
 * @param maxRetries - Максимум попыток при конфликте
 * @returns true если успешно, false если конфликт
 */
export async function atomicUpdateWithVersion<T>(
  key: string,
  updateFn: (current: T | null) => T,
  maxRetries: number = 5
): Promise<boolean> {
  const client = await getRedisClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // WATCH для optimistic locking
      await client.watch(key);

      // Получить текущее значение
      const currentValue = await client.get(key);
      const current = currentValue ? JSON.parse(currentValue) : null;

      // Вычислить новое значение
      const newValue = updateFn(current);

      // Попытаться обновить в транзакции
      const multi = client.multi();
      multi.set(key, JSON.stringify(newValue));
      const results = await multi.exec();

      if (results !== null) {
        // Транзакция успешна
        return true;
      }

      // Конфликт - retry
      console.log(`Optimistic lock conflict, retry ${attempt + 1}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    } catch (error) {
      console.error('Atomic update failed:', error);
      await client.unwatch();
      return false;
    }
  }

  // Превышено количество попыток
  console.error('Atomic update failed after max retries');
  return false;
}

/**
 * Атомарный инкремент счётчика
 * 
 * @param key - Ключ счётчика
 * @param amount - Величина инкремента (по умолчанию 1)
 * @returns Новое значение счётчика
 */
export async function atomicIncrement(
  key: string,
  amount: number = 1
): Promise<number> {
  try {
    const client = await getRedisClient();
    return await client.incrBy(key, amount);
  } catch (error) {
    console.error('Atomic increment failed:', error);
    return 0;
  }
}

/**
 * Атомарное добавление в sorted set с score
 * 
 * @param key - Ключ sorted set
 * @param member - Элемент для добавления
 * @param score - Score элемента
 * @returns true если успешно
 */
export async function atomicZAdd(
  key: string,
  member: string,
  score: number
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.zAdd(key, { score, value: member });
    return true;
  } catch (error) {
    console.error('Atomic zAdd failed:', error);
    return false;
  }
}
