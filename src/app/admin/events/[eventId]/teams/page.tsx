import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getTeamsByEventId } from '@/services/teamService';
import { getParticipantsByEventId } from '@/services/participantService';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TeamsList from '@/components/admin/TeamsList';
import Breadcrumbs from '@/components/Breadcrumbs';
import { generateCSRFToken } from '@/lib/csrf';

interface TeamsPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function TeamsManagementPage({ params }: TeamsPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);
  
  const { eventId } = await params;
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  const teams = await getTeamsByEventId(eventId);
  const participants = await getParticipantsByEventId(eventId);
  const csrfToken = await generateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: event.name, href: `/admin/events/${eventId}` },
            { label: 'Участники' }
          ]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Участники: {event.name}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <Link
                href={`/admin/events/${eventId}`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Основное
              </Link>
              <Link
                href={`/admin/events/${eventId}/teams`}
                className="px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-medium"
              >
                Участники
              </Link>
              <Link
                href={`/admin/events/${eventId}/jury`}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Жюри
              </Link>
            </nav>
          </div>

          <div className="p-6">
            <TeamsList 
              teams={teams} 
              participants={participants}
              eventId={eventId}
              csrfToken={csrfToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
