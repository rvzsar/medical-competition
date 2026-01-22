/**
 * Jury Contests Page - список назначенных конкурсов для жюри
 * 
 * Requirements: 4.3, 4.6
 */

import { requireAuth } from '@/lib/dal';
import { getJuryAssignmentsByJuryId } from '@/services/juryService';
import { getContestById } from '@/services/contestService';
import { getEventById } from '@/services/eventService';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

export default async function JuryContestsPage() {
  const session = await requireAuth(['Jury']);
  
  if (!session.juryId) {
    notFound();
  }

  // Получить назначения жюри
  const assignments = await getJuryAssignmentsByJuryId(session.juryId);
  
  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs 
            items={[{ label: 'Мои конкурсы' }]}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Мои конкурсы</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              У вас пока нет назначений на конкурсы.
            </p>
            <p className="text-sm text-gray-500">
              Обратитесь к администратору для назначения на мероприятия.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Загрузить конкурсы и мероприятия
  const contestsData = await Promise.all(
    assignments.flatMap(a => 
      (a.contestIds || []).map(async (contestId) => {
        const contest = await getContestById(contestId);
        if (!contest) return null;
        
        const event = await getEventById(contest.eventId);
        return { contest, event, assignment: a };
      })
    )
  );

  const contests = contestsData.filter((item): item is NonNullable<typeof item> => item !== null);

  // Группировать по мероприятиям
  const eventGroups = contests.reduce((acc, { contest, event }) => {
    if (!event) return acc;
    
    if (!acc[event.id]) {
      acc[event.id] = {
        event,
        contests: []
      };
    }
    acc[event.id].contests.push(contest);
    return acc;
  }, {} as Record<string, { event: NonNullable<typeof contests[0]['event']>, contests: typeof contests[0]['contest'][] }>);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs 
          items={[{ label: 'Мои конкурсы' }]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Мои конкурсы для оценивания
          </h1>
          <p className="text-gray-600">
            Вы назначены на {contests.length} конкурс(ов) в {Object.keys(eventGroups).length} мероприятии(ях)
          </p>
        </div>

        <div className="space-y-8">
          {Object.values(eventGroups).map(({ event, contests: eventContests }) => (
            <div key={event.id} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {event.name}
                </h2>
                {event.description && (
                  <p className="text-gray-600 mt-1">{event.description}</p>
                )}
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.status === 'draft' && 'Черновик'}
                  {event.status === 'active' && 'Активно'}
                  {event.status === 'completed' && 'Завершено'}
                  {event.status === 'archived' && 'Архив'}
                </span>
              </div>

              <div className="p-6 grid gap-4 md:grid-cols-2">
                {eventContests.map((contest) => (
                  <Link
                    key={contest.id}
                    href={`/contests/${contest.id}`}
                    className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {contest.name}
                    </h3>
                    {contest.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {contest.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Критериев: {contest.criteria.length}
                      </span>
                      {contest.maxScore && (
                        <span className="text-blue-600 font-medium">
                          Макс. балл: {contest.maxScore}
                        </span>
                      )}
                    </div>
                    {contest.timeLimit && (
                      <div className="mt-2 text-xs text-gray-500">
                        ⏱️ Лимит времени: {contest.timeLimit} мин
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
