/**
 * Event Management Page - управление мероприятием
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getContestsByEventId } from '@/services/contestService';
import { generateCSRFToken } from '@/lib/csrf';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EventForm from '@/components/admin/EventForm';
import ContestsList from '@/components/admin/ContestsList';
import Breadcrumbs from '@/components/Breadcrumbs';

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventManagementPage({ params }: EventPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);
  
  const { eventId } = await params;
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  const contests = await getContestsByEventId(eventId);
  const csrfToken = await generateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: event.name }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Управление мероприятием
          </h1>
        </div>

        {/* Event Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {event.name}
              </h2>
              {event.description && (
                <p className="text-gray-600 mt-2">{event.description}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'draft'
                  ? 'bg-gray-100 text-gray-800'
                  : event.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : event.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {event.status === 'draft' && 'Черновик'}
              {event.status === 'active' && 'Активно'}
              {event.status === 'completed' && 'Завершено'}
              {event.status === 'archived' && 'Архив'}
            </span>
          </div>

          {event.startDate && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Даты:</span>{' '}
              {new Date(event.startDate).toLocaleDateString('ru-RU')}
              {event.endDate &&
                ` - ${new Date(event.endDate).toLocaleDateString('ru-RU')}`}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <Link
                href={`/admin/events/${eventId}`}
                className="px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-medium whitespace-nowrap"
              >
                Основное
              </Link>
              <Link
                href={`/admin/events/${eventId}/teams`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
              >
                Участники
              </Link>
              <Link
                href={`/admin/events/${eventId}/jury`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
              >
                Жюри
              </Link>
              <Link
                href={`/admin/events/${eventId}/scoring`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
              >
                📊 Оценки жюри
              </Link>
              <Link
                href={`/admin/events/${eventId}/certificates`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
              >
                Сертификаты
              </Link>
            </nav>
          </div>

          <div className="p-6">
            {/* Event Form */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Редактировать мероприятие
              </h3>
              <EventForm event={event} csrfToken={csrfToken} />
            </div>

            {/* Contests Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Конкурсы ({contests.length})
                </h3>
                {event.status === 'draft' && (
                  <Link
                    href={`/admin/events/${eventId}/contests/new`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Добавить конкурс
                  </Link>
                )}
              </div>

              {event.status !== 'draft' && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Мероприятие не в статусе "Черновик". Изменение структуры
                    конкурсов недоступно.
                  </p>
                </div>
              )}

              <ContestsList contests={contests} eventId={eventId} canEdit={event.status === 'draft'} csrfToken={csrfToken} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
