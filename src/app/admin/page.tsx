/**
 * Admin Dashboard - главная страница администратора
 * 
 * Requirements: 6.1, 6.4, 6.5
 */

import { requireAuth } from '@/lib/dal';
import { getAllEventsMetrics, getEventsMetricsByStatus } from '@/services/dashboardService';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { sanitizeHTML } from '@/lib/sanitize';
import type { EventStatus } from '@/types';

interface AdminDashboardProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  // Требовать авторизацию Admin или Event_Manager
  await requireAuth(['Admin', 'Event_Manager']);

  const params = await searchParams;
  const statusFilter = params.status as EventStatus | undefined;
  
  // Загрузить метрики с учётом фильтра
  const validStatuses: EventStatus[] = ['draft', 'active', 'completed', 'archived'];
  const metrics = statusFilter && validStatuses.includes(statusFilter)
    ? await getEventsMetricsByStatus(statusFilter)
    : await getAllEventsMetrics();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[{ label: 'Мероприятия' }]}
          className="mb-4"
        />

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Панель управления мероприятиями
          </h1>
          <div className="flex gap-3">
            <Link
              href="/admin/protocol"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              📋 Протокол оценок
            </Link>
            <Link
              href="/admin/events/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Создать мероприятие
            </Link>
          </div>
        </div>

        {/* Фильтры по статусу */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className={`px-4 py-2 border rounded-lg ${
              !statusFilter 
                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            Все ({metrics.length})
          </Link>
          <Link
            href="/admin?status=draft"
            className={`px-4 py-2 border rounded-lg ${
              statusFilter === 'draft'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            Черновики
          </Link>
          <Link
            href="/admin?status=active"
            className={`px-4 py-2 border rounded-lg ${
              statusFilter === 'active'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            Активные
          </Link>
          <Link
            href="/admin?status=completed"
            className={`px-4 py-2 border rounded-lg ${
              statusFilter === 'completed'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            Завершённые
          </Link>
          <Link
            href="/admin?status=archived"
            className={`px-4 py-2 border rounded-lg ${
              statusFilter === 'archived'
                ? 'bg-gray-200 text-gray-700 border-gray-300'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            Архив
          </Link>
        </div>

        {/* Список мероприятий */}
        <div className="grid gap-6">
          {metrics.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Нет мероприятий. Создайте первое мероприятие.
            </div>
          ) : (
            metrics.map((metric) => (
              <div
                key={metric.event.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {metric.event.name}
                    </h2>
                    {metric.event.description && (
                      <p 
                        className="text-gray-600 mt-1"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeHTML(metric.event.description) 
                        }}
                      />
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      metric.event.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : metric.event.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : metric.event.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {metric.event.status === 'draft' && 'Черновик'}
                    {metric.event.status === 'active' && 'Активно'}
                    {metric.event.status === 'completed' && 'Завершено'}
                    {metric.event.status === 'archived' && 'Архив'}
                  </span>
                </div>

                {/* Метрики */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.contestsCount}
                    </div>
                    <div className="text-sm text-gray-600">Конкурсов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.teamsCount || metric.participantsCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {metric.teamsCount ? 'Команд' : 'Участников'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.scoresCount}
                    </div>
                    <div className="text-sm text-gray-600">Оценок</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.completionPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Завершено</div>
                  </div>
                </div>

                {/* Прогресс бар */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${metric.completionPercentage}%` }}
                  />
                </div>

                {/* Действия */}
                <div className="flex gap-3">
                  <Link
                    href={`/admin/events/${metric.event.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Управление
                  </Link>
                  <Link
                    href={`/admin/events/${metric.event.id}/teams`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Участники
                  </Link>
                  <Link
                    href={`/admin/events/${metric.event.id}/jury`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Жюри
                  </Link>
                  <Link
                    href={`/results?eventId=${metric.event.id}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Результаты
                  </Link>
                  <Link
                    href={`/admin/events/${metric.event.id}/certificates`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Сертификаты
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
