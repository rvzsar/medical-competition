import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getContestsByEventId } from '@/services/contestService';
import { getJuryAssignmentsByEventId } from '@/services/juryService';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JuryManagement from '@/components/admin/JuryManagement';
import Breadcrumbs from '@/components/Breadcrumbs';
import { generateCSRFToken } from '@/lib/csrf';

interface JuryPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function JuryManagementPage({ params }: JuryPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);
  
  const { eventId } = await params;
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  const [contests, assignments, csrfToken] = await Promise.all([
    getContestsByEventId(eventId),
    getJuryAssignmentsByEventId(eventId),
    generateCSRFToken(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: event.name, href: `/admin/events/${eventId}` },
            { label: 'Жюри' }
          ]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Жюри: {event.name}
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
                className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Участники
              </Link>
              <Link
                href={`/admin/events/${eventId}/jury`}
                className="px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-medium"
              >
                Жюри
              </Link>
            </nav>
          </div>

          <div className="p-6">
            <JuryManagement 
              eventId={eventId}
              contests={contests}
              assignments={assignments}
              csrfToken={csrfToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
