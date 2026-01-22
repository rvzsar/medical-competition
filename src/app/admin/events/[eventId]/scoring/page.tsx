/**
 * Bulk Jury Scoring Page - страница массового ввода оценок жюри
 * 
 * Requirements: 2.2
 */

import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getContestsByEventId } from '@/services/contestService';
import { getParticipantsByEventId } from '@/services/participantService';
import { getTeamsByEventId } from '@/services/teamService';
import { getJuryAssignmentsByEventId, getJuryMemberById } from '@/services/juryService';
import { getAllScoresByEventId } from '@/services/scoreService';
import { generateCSRFToken } from '@/lib/csrf';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import BulkScoringPanel from '@/components/admin/BulkScoringPanel';
import type { JuryAssignmentWithMember } from '@/types/bulk-scoring';

interface BulkScoringPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function BulkScoringPage({ params }: BulkScoringPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);
  
  const { eventId } = await params;
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  // TypeScript не понимает что notFound() прерывает выполнение
  // Используем non-null assertion после проверки
  const safeEvent = event!;

  // Загрузить все необходимые данные параллельно
  const [
    contests,
    participants,
    teams,
    juryAssignments,
    csrfToken,
    scores,
  ] = await Promise.all([
    getContestsByEventId(eventId),
    getParticipantsByEventId(eventId),
    getTeamsByEventId(eventId),
    getJuryAssignmentsByEventId(eventId),
    generateCSRFToken(),
    getAllScoresByEventId(eventId),
  ]);

  // Обогатить назначения жюри данными о членах жюри
  const juryAssignmentsWithMembers: JuryAssignmentWithMember[] = (await Promise.all(
    juryAssignments.map(async (assignment) => {
      const jury = await getJuryMemberById(assignment.juryId);
      if (!jury) return null;
      return {
        ...assignment,
        jury,
      };
    })
  )).filter((r): r is JuryAssignmentWithMember => r !== null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: safeEvent.name, href: `/admin/events/${eventId}` },
            { label: 'Оценки жюри' }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Оценки жюри
          </h1>
          <p className="text-gray-600 mt-1">
            Массовый ввод оценок от всех членов жюри
          </p>
        </div>

        {/* Event Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {safeEvent.name}
              </h2>
              <p className="text-sm text-gray-600">
                {contests.length} конкурсов • {participants.length + teams.length} участников • {juryAssignmentsWithMembers.length} жюри
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                safeEvent.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : safeEvent.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {safeEvent.status === 'draft' && 'Черновик'}
              {safeEvent.status === 'active' && 'Активно'}
              {safeEvent.status === 'completed' && 'Завершено'}
              {safeEvent.status === 'archived' && 'Архив'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <Link
                href={`/admin/events/${eventId}`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
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
                className="px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-medium whitespace-nowrap"
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
            {/* Проверка статуса мероприятия */}
            {safeEvent.status === 'draft' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Мероприятие в статусе "Черновик". Для ввода оценок измените статус на "Активно".
                </p>
              </div>
            )}

            {/* Проверка наличия конкурсов */}
            {contests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>Нет конкурсов для оценивания</p>
                <p className="text-sm mt-1">
                  <Link href={`/admin/events/${eventId}`} className="text-blue-600 hover:underline">
                    Добавьте конкурсы
                  </Link>
                  {' '}в настройках мероприятия
                </p>
              </div>
            )}

            {/* Проверка наличия участников */}
            {contests.length > 0 && participants.length === 0 && teams.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>Нет участников для оценивания</p>
                <p className="text-sm mt-1">
                  <Link href={`/admin/events/${eventId}/teams`} className="text-blue-600 hover:underline">
                    Добавьте участников
                  </Link>
                  {' '}в настройках мероприятия
                </p>
              </div>
            )}

            {/* Проверка наличия жюри */}
            {contests.length > 0 && (participants.length > 0 || teams.length > 0) && juryAssignmentsWithMembers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">⚖️</div>
                <p>Жюри не назначено на мероприятие</p>
                <p className="text-sm mt-1">
                  <Link href={`/admin/events/${eventId}/jury`} className="text-blue-600 hover:underline">
                    Назначьте жюри
                  </Link>
                  {' '}для начала оценивания
                </p>
              </div>
            )}

            {/* Панель массового оценивания */}
            {contests.length > 0 && 
             (participants.length > 0 || teams.length > 0) && 
             juryAssignmentsWithMembers.length > 0 && (
              <BulkScoringPanel
                event={safeEvent}
                participants={participants}
                teams={teams}
                juryAssignments={juryAssignmentsWithMembers}
                contests={contests}
                scores={scores}
                csrfToken={csrfToken}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
