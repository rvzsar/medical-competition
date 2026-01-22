/**
 * Results Page - страница результатов
 * 
 * Requirements: 7.1, 7.2, 7.6
 */

import { getAllEvents } from '@/services/eventService';
import { getEventResults } from '@/services/resultsService';
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize';
import Breadcrumbs from '@/components/Breadcrumbs';

interface ResultsPageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const events = await getAllEvents();
  const selectedEventId = params.eventId || events[0]?.id;

  let results = [];
  if (selectedEventId) {
    results = await getEventResults(selectedEventId);
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[{ label: 'Результаты' }]}
          className="mb-4"
        />

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Результаты мероприятий
        </h1>

        {/* Выбор мероприятия */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите мероприятие:
          </label>
          <select
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
            value={selectedEventId || ''}
            onChange={(e) => {
              window.location.href = `/results?eventId=${e.target.value}`;
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {sanitizeText(selectedEvent.name)}
            </h2>
            {selectedEvent.description && (
              <div 
                className="text-gray-600"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedEvent.description) }}
              />
            )}
          </div>
        )}

        {/* Таблица результатов */}
        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Нет результатов для отображения
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Место
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Участник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Учреждение
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Общий балл
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Детали
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.teamId || result.participantId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-2xl font-bold ${
                            result.rank === 1
                              ? 'text-yellow-500'
                              : result.rank === 2
                              ? 'text-gray-400'
                              : result.rank === 3
                              ? 'text-orange-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {result.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sanitizeText(result.name)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {result.institution ? sanitizeText(result.institution) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.totalScore.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Показать breakdown
                        </summary>
                        <div className="mt-2 space-y-2">
                          {result.contestScores.map((cs) => (
                            <div key={cs.contestId} className="pl-4">
                              <div className="font-medium">{sanitizeText(cs.contestName)}</div>
                              <div className="text-gray-600">
                                Балл: {cs.score.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {cs.juryBreakdown.map((j) => (
                                  <div key={j.juryId}>
                                    Жюри {sanitizeText(j.juryName)}: {j.score.toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Экспорт */}
        {selectedEventId && results.length > 0 && (
          <div className="mt-6 flex gap-4">
            <a
              href={`/api/events/${selectedEventId}/results/export?format=pdf`}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Экспорт в PDF
            </a>
            <a
              href={`/api/events/${selectedEventId}/results/export?format=excel`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Экспорт в Excel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
