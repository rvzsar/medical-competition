/**
 * Contest Scoring Page - страница оценивания конкретного конкурса
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getContestById } from '@/services/contestService';
import { getTeamsByEventId } from '@/services/teamService';
import { getParticipantsByEventId } from '@/services/participantService';
import { getScoresByContestId } from '@/services/scoreService';
import { generateCSRFToken } from '@/lib/csrf';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import ScoringInterface from '@/components/ScoringInterface';

interface ContestScoringPageProps {
  params: Promise<{ eventId: string; contestId: string }>;
}

export default async function ContestScoringPage({ params }: ContestScoringPageProps) {
  const session = await requireAuth(['Admin', 'Event_Manager', 'Jury']);
  
  const { eventId, contestId } = await params;
  
  // Проверка доступа жюри к мероприятию
  if (session.role === 'Jury' && session.eventId && session.eventId !== eventId) {
    notFound(); // Жюри может видеть только своё мероприятие
  }
  
  const [event, contest] = await Promise.all([
    getEventById(eventId),
    getContestById(contestId),
  ]);

  if (!event || !contest) {
    notFound();
  }

  // Проверить доступ жюри к конкурсу
  if (session.role === 'Jury' && session.contestIds && !session.contestIds.includes(contestId)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Оценивание', href: '/scoring' },
              { label: event.name }
            ]}
            className="mb-4"
          />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Доступ запрещён
            </h2>
            <p className="text-red-800">
              Вы не назначены на этот конкурс. Обратитесь к организатору мероприятия.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Проверить что мероприятие активно
  if (event.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Оценивание', href: '/scoring' },
              { label: event.name }
            ]}
            className="mb-4"
          />
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              Оценивание недоступно
            </h2>
            <p className="text-yellow-800">
              Мероприятие не в статусе "Активно". Оценивание возможно только для активных мероприятий.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [teams, participants, csrfToken, allScores] = await Promise.all([
    getTeamsByEventId(eventId),
    getParticipantsByEventId(eventId),
    generateCSRFToken(),
    getScoresByContestId(contestId),
  ]);

  // Фильтруем оценки текущего жюри
  const myScores = allScores.filter((s) => s.juryId === session.userId);
  const scoredTeamIds = new Set(myScores.filter((s) => s.teamId).map((s) => s.teamId));
  const scoredParticipantIds = new Set(myScores.filter((s) => s.participantId).map((s) => s.participantId));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Оценивание', href: '/scoring' },
            { label: event.name, href: '/scoring' },
            { label: contest.name }
          ]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{contest.name}</h1>
          <p className="text-gray-600 mt-2">{event.name}</p>
          {contest.description && (
            <p className="text-gray-500 mt-1">{contest.description}</p>
          )}
        </div>

        {/* Информация о конкурсе */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Критериев:</span>{' '}
              <span className="text-blue-900">{contest.criteria.length}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Макс. балл:</span>{' '}
              <span className="text-blue-900">{contest.maxScore}</span>
            </div>
            {teams.length > 0 && (
              <div>
                <span className="text-blue-600 font-medium">Команд:</span>{' '}
                <span className="text-blue-900">{teams.length}</span>
              </div>
            )}
            {participants.length > 0 && (
              <div>
                <span className="text-blue-600 font-medium">Участников:</span>{' '}
                <span className="text-blue-900">{participants.length}</span>
              </div>
            )}
            <div>
              <span className="text-blue-600 font-medium">Оценено вами:</span>{' '}
              <span className="text-blue-900">{myScores.length}</span>
            </div>
          </div>
        </div>

        {/* Список уже оценённых */}
        {myScores.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              Вы уже оценили:
            </h3>
            <div className="flex flex-wrap gap-2">
              {myScores.map((score) => {
                const team = teams.find((t) => t.id === score.teamId);
                const participant = participants.find((p) => p.id === score.participantId);
                const name = team?.name || 
                  (participant ? `${participant.lastName} ${participant.firstName}` : 'Неизвестно');
                return (
                  <span
                    key={score.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                  >
                    {name}: {score.totalScore.toFixed(1)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Интерфейс оценивания */}
        <ScoringInterface
          contest={contest}
          teams={teams}
          participants={participants}
          juryId={session.userId}
          csrfToken={csrfToken}
          scoredTeamIds={Array.from(scoredTeamIds) as string[]}
          scoredParticipantIds={Array.from(scoredParticipantIds) as string[]}
        />
      </div>
    </div>
  );
}
