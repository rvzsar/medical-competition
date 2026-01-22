/**
 * Audit Log Service
 * 
 * Сервис для логирования действий пользователей
 */

import { getRedisClient } from '@/lib/redis';
import type { AuditLogEntry, AuditAction, AuditLogFilter } from '@/types/audit-log';
import { v4 as uuidv4 } from 'uuid';

const AUDIT_LOG_KEY = 'audit:logs';
const AUDIT_LOG_BY_USER_PREFIX = 'audit:user:';
const AUDIT_LOG_BY_EVENT_PREFIX = 'audit:event:';
const MAX_LOGS = 10000; // Максимум логов в основном списке
const LOG_TTL = 60 * 60 * 24 * 90; // 90 дней

/**
 * Записать действие в лог
 */
export async function logAction(
  action: AuditAction,
  user: { id: string; name: string; role: string },
  details: AuditLogEntry['details'],
  ipAddress?: string
): Promise<void> {
  try {
    const redis = await getRedisClient();
    
    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      action,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details,
      ipAddress,
    };
    
    const entryJson = JSON.stringify(entry);
    
    // Добавляем в основной список (с ограничением размера)
    await redis.lPush(AUDIT_LOG_KEY, entryJson);
    await redis.lTrim(AUDIT_LOG_KEY, 0, MAX_LOGS - 1);
    
    // Добавляем в индекс по пользователю
    const userKey = `${AUDIT_LOG_BY_USER_PREFIX}${user.id}`;
    await redis.lPush(userKey, entryJson);
    await redis.lTrim(userKey, 0, 999); // Последние 1000 действий пользователя
    await redis.expire(userKey, LOG_TTL);
    
    // Добавляем в индекс по мероприятию (если есть)
    if (details.eventId) {
      const eventKey = `${AUDIT_LOG_BY_EVENT_PREFIX}${details.eventId}`;
      await redis.lPush(eventKey, entryJson);
      await redis.lTrim(eventKey, 0, 999);
      await redis.expire(eventKey, LOG_TTL);
    }
    
  } catch (error) {
    // Логирование не должно ломать основной функционал
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Получить логи с фильтрацией
 */
export async function getAuditLogs(filter: AuditLogFilter = {}): Promise<{
  logs: AuditLogEntry[];
  total: number;
}> {
  try {
    const redis = await getRedisClient();
    const { action, userId, eventId, startDate, endDate, limit = 50, offset = 0 } = filter;
    
    let key = AUDIT_LOG_KEY;
    
    // Выбираем индекс в зависимости от фильтра
    if (userId) {
      key = `${AUDIT_LOG_BY_USER_PREFIX}${userId}`;
    } else if (eventId) {
      key = `${AUDIT_LOG_BY_EVENT_PREFIX}${eventId}`;
    }
    
    // Получаем все записи (для фильтрации)
    const total = await redis.lLen(key);
    const rawLogs = await redis.lRange(key, 0, Math.min(total, 1000) - 1);
    
    let logs: AuditLogEntry[] = rawLogs
      .map(raw => {
        try {
          return JSON.parse(raw) as AuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is AuditLogEntry => log !== null);
    
    // Фильтрация по действию
    if (action) {
      const actions = Array.isArray(action) ? action : [action];
      logs = logs.filter(log => actions.includes(log.action));
    }
    
    // Фильтрация по дате
    if (startDate) {
      const start = new Date(startDate).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() <= end);
    }
    
    // Пагинация
    const paginatedLogs = logs.slice(offset, offset + limit);
    
    return {
      logs: paginatedLogs,
      total: logs.length,
    };
    
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Получить статистику по действиям
 */
export async function getAuditStats(days: number = 7): Promise<{
  totalActions: number;
  actionCounts: Record<string, number>;
  activeUsers: { userId: string; userName: string; count: number }[];
  recentEmails: number;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { logs } = await getAuditLogs({
      startDate: startDate.toISOString(),
      limit: 5000,
    });
    
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, { name: string; count: number }> = {};
    let recentEmails = 0;
    
    for (const log of logs) {
      // Подсчёт по действиям
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Подсчёт по пользователям
      if (!userCounts[log.userId]) {
        userCounts[log.userId] = { name: log.userName, count: 0 };
      }
      userCounts[log.userId].count++;
      
      // Подсчёт email
      if (log.action === 'email_sent' || log.action === 'email_bulk_sent') {
        recentEmails++;
      }
    }
    
    // Топ активных пользователей
    const activeUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalActions: logs.length,
      actionCounts,
      activeUsers,
      recentEmails,
    };
    
  } catch (error) {
    console.error('Failed to get audit stats:', error);
    return {
      totalActions: 0,
      actionCounts: {},
      activeUsers: [],
      recentEmails: 0,
    };
  }
}

/**
 * Хелпер для логирования email
 */
export async function logEmailSent(
  user: { id: string; name: string; role: string },
  recipientEmail: string,
  subject: string,
  eventId?: string,
  eventName?: string
): Promise<void> {
  await logAction('email_sent', user, {
    recipientEmail,
    emailSubject: subject,
    eventId,
    eventName,
  });
}

/**
 * Хелпер для логирования массовой рассылки
 */
export async function logBulkEmailSent(
  user: { id: string; name: string; role: string },
  recipientCount: number,
  eventId?: string,
  eventName?: string
): Promise<void> {
  await logAction('email_bulk_sent', user, {
    recipientCount,
    eventId,
    eventName,
    description: `Отправлено ${recipientCount} писем`,
  });
}

/**
 * Хелпер для логирования создания сущности
 */
export async function logEntityCreated(
  user: { id: string; name: string; role: string },
  entityType: 'event' | 'contest' | 'team',
  entityId: string,
  entityName: string,
  eventId?: string,
  eventName?: string
): Promise<void> {
  const actionMap = {
    event: 'event_created',
    contest: 'contest_created',
    team: 'team_created',
  } as const;
  
  await logAction(actionMap[entityType], user, {
    entityId,
    entityName,
    entityType,
    eventId,
    eventName,
  });
}
