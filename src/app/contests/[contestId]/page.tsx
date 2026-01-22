import { requireAuth } from '@/lib/dal';
import { getContestById } from '@/services/contestService';
import { getTeamsByEventId } from '@/services/teamService';
import { getParticipantsByEventId } from '@/services/participantService';
import { hasJuryAccessToContest } from '@/services/juryService';
import { notFound, redirect } from 'next/navigation';
import ScoringInterface from '@/components/ScoringInterface';
import { generateCSRFToken } from '@/lib/csrf';

interface ScoringPageProps {
  params: Promise<{ contestId: string }>;
}

export default async function ScoringPage({ params }: ScoringPageProps) {
  const session = await requireAuth(['Jury']);
  
  const { contestId } = await params;
  const contest = await getContestById(contestId);
  
  if (!contest) {
    notFound();
  }

  // Проверка доступа жюри к конкурсу
  const hasAccess = await hasJuryAccessToContest(session.juryId!, contestId);
  if (!hasAccess) {
    redirect('/contests');
  }

  // Генерация CSRF токена
  const csrfToken = await generateCSRFToken();

  // Загрузить команды или участников в зависимости от типа мероприятия
  const teams = await getTeamsByEventId(contest.eventId);
  const participants = await getParticipantsByEventId(contest.eventId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Оценивание: {contest.name}
          </h1>
          {contest.description && (
            <p className="text-gray-600 mt-2">{contest.description}</p>
          )}
          {contest.timeLimit && (
            <p className="text-sm text-gray-500 mt-1">
              Лимит времени: {contest.timeLimit} минут
            </p>
          )}
        </div>

        <ScoringInterface
          contest={contest}
          teams={teams}
          participants={participants}
          juryId={session.juryId!}
          csrfToken={csrfToken}
        />
      </div>
    </div>
  );
}
