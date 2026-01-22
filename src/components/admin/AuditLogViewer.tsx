'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuditLogEntry, AuditAction } from '@/types/audit-log';
import { ACTION_LABELS, ACTION_ICONS } from '@/types/audit-log';

interface AuditLogViewerProps {
  eventId?: string;
  compact?: boolean;
}

interface AuditStats {
  totalActions: number;
  actionCounts: Record<string, number>;
  activeUsers: { userId: string; userName: string; count: number }[];
  recentEmails: number;
}

const ACTION_FILTERS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'Все действия' },
  { value: 'email_sent', label: '📧 Email отправлен' },
  { value: 'email_bulk_sent', label: '📬 Массовая рассылка' },
  { value: 'event_created', label: '🎉 Создание мероприятия' },
  { value: 'contest_created', label: '🏆 Создание конкурса' },
  { value: 'team_created', label: '👥 Создание команды' },
  { value: 'score_submitted', label: '📝 Оценки' },
  { value: 'certificate_generated', label: '📜 Сертификаты' },
  { value: 'user_login', label: '🔑 Входы в систему' },
];

export default function AuditLogViewer({ eventId, compact = false }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  
  // Пагинация
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = compact ? 10 : 25;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Вычисляем даты
      let startDate: string | undefined;
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
          break;
      }

      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (eventId) params.set('eventId', eventId);
      if (startDate) params.set('startDate', startDate);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки логов');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, dateRange, eventId, limit, offset]);

  const loadStats = useCallback(async () => {
    if (compact) return;
    
    try {
      const response = await fetch('/api/admin/audit-logs?stats=true&days=7');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [compact]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Форматирование даты
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Меньше часа
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} мин. назад`;
    }
    
    // Сегодня
    if (date.toDateString() === now.toDateString()) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Вчера
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Описание действия
  const getActionDescription = (log: AuditLogEntry): string => {
    const { action, details } = log;
    
    switch (action) {
      case 'email_sent':
        return `→ ${details.recipientEmail}${details.emailSubject ? ` (${details.emailSubject})` : ''}`;
      case 'email_bulk_sent':
        return `${details.recipientCount} получателей`;
      case 'event_created':
      case 'event_updated':
      case 'event_deleted':
        return details.entityName || details.eventName || '';
      case 'contest_created':
      case 'contest_updated':
      case 'contest_deleted':
        return `${details.entityName}${details.eventName ? ` (${details.eventName})` : ''}`;
      case 'team_created':
      case 'team_updated':
      case 'team_deleted':
        return details.entityName || details.teamName || '';
      case 'score_submitted':
      case 'score_updated':
        return `${details.teamName}: ${details.score}`;
      case 'certificate_generated':
        return details.entityName || '';
      default:
        return details.description || '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Статистика (только для полной версии) */}
      {!compact && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalActions}</div>
            <div className="text-sm text-gray-500">Действий за неделю</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.recentEmails}</div>
            <div className="text-sm text-gray-500">Email отправлено</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.activeUsers.length}</div>
            <div className="text-sm text-gray-500">Активных пользователей</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.actionCounts['event_created'] || 0}
            </div>
            <div className="text-sm text-gray-500">Мероприятий создано</div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value as AuditAction | '');
            setOffset(0);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {ACTION_FILTERS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="flex gap-1">
          {(['today', 'week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                setDateRange(range);
                setOffset(0);
              }}
              className={`px-3 py-2 text-sm rounded-lg ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'today' && 'Сегодня'}
              {range === 'week' && 'Неделя'}
              {range === 'month' && 'Месяц'}
              {range === 'all' && 'Все'}
            </button>
          ))}
        </div>

        <button
          onClick={loadLogs}
          className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          🔄 Обновить
        </button>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Таблица логов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Загрузка...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Нет записей за выбранный период
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Время
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Действие
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Пользователь
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Детали
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span>{ACTION_ICONS[log.action]}</span>
                        <span>{ACTION_LABELS[log.action]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{log.userName}</div>
                      <div className="text-xs text-gray-500">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {getActionDescription(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Пагинация */}
        {total > limit && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Показано {offset + 1}–{Math.min(offset + limit, total)} из {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                ← Назад
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Топ активных пользователей (только для полной версии) */}
      {!compact && stats && stats.activeUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Активные пользователи за неделю
          </h3>
          <div className="space-y-2">
            {stats.activeUsers.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{index + 1}.</span>
                  <span className="font-medium">{user.userName}</span>
                </div>
                <span className="text-sm text-gray-500">{user.count} действий</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
