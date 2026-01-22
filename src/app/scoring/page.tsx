/**
 * Scoring Page - страница выбора мероприятия и конкурса для оценивания
 * 
 * Requirements: 5.1, 5.2
 */

import { requireAuth } from '@/lib/dal';
import { getAllEvents } from '@/services/eventService';
import { getContestsByEventId } from '@/services/contestService';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

export default async function ScoringPage() {
  const session = await requireAuth(['Admin', 'Event_Manager', 'Jury']);
  
  // Получить все активные мероприятия
  const allEvents = await getAllEvents();
  const activeEvents = allEvents.filter(e => e.status === 'active');

  // Загрузить конкурсы для каждого активного мероприятия
  const eventsWithContests = await Promise.all(
    activeEvents.map(async (event) => {
      const contests = await getContestsByEventId(event.id);
      return { event, contests };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs 
          items={[{ label: 'Оценивание' }]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Оценивание</h1>
          <p className="text-gray-600 mt-2">
            Выберите мероприятие и конкурс для выставления оценок
          </p>
        </div>

        {eventsWithContests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <p className="text-gray-600">Нет активных мероприятий для оценивания.</p>
            <p className="text-gray-500 text-sm mt-2">
              Мероприятия появятся здесь после того, как организатор переведёт их в статус "Активно".
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {eventsWithContests.map(({ event, contests }) => (
              <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">{event.name}</h2>
                  {event.description && (
                    <p className="text-blue-100 text-sm mt-1">{event.description}</p>
                  )}
                </div>

                <div className="p-6">
                  {contests.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      В этом мероприятии пока нет конкурсов
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {contests.map((contest) => (
                        <Link
                          key={contest.id}
                          href={`/scoring/${event.id}/${contest.id}`}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                              {contest.name}
                            </h3>
                            {contest.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {contest.description}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-gray-400">
                              <span>Критериев: {contest.criteria.length}</span>
                              <span>Макс. балл: {contest.maxScore}</span>
                            </div>
                          </div>
                          <div className="text-gray-400 group-hover:text-blue-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
