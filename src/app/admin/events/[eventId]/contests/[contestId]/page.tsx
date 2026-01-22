import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getContestById } from '@/services/contestService';
import { notFound } from 'next/navigation';
import ContestForm from '@/components/admin/ContestForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import { generateCSRFToken } from '@/lib/csrf';

interface EditContestPageProps {
  params: Promise<{ eventId: string; contestId: string }>;
}

export default async function EditContestPage({ params }: EditContestPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);
  
  const { eventId, contestId } = await params;
  const event = await getEventById(eventId);
  const contest = await getContestById(contestId);
  
  if (!event || !contest) {
    notFound();
  }

  const canEdit = event.status === 'draft';
  const csrfToken = await generateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: event.name, href: `/admin/events/${eventId}` },
            { label: contest.name }
          ]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {canEdit ? 'Редактировать конкурс' : 'Просмотр конкурса'}
          </h1>
          <p className="text-gray-600 mt-2">{event.name}</p>
        </div>

        {!canEdit && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Мероприятие не в статусе "Черновик". Редактирование недоступно.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <ContestForm eventId={eventId} contest={contest} readOnly={!canEdit} csrfToken={csrfToken} />
        </div>
      </div>
    </div>
  );
}
