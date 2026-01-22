import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ContestForm from '@/components/admin/ContestForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import { generateCSRFToken } from '@/lib/csrf';

interface NewContestPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function NewContestPage({ params }: NewContestPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);
  
  const { eventId } = await params;
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  if (event.status !== 'draft') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Мероприятия', href: '/admin' },
              { label: event.name, href: `/admin/events/${eventId}` },
              { label: 'Новый конкурс' }
            ]}
            className="mb-4"
          />
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              Невозможно добавить конкурс
            </h2>
            <p className="text-yellow-800">
              Мероприятие не в статусе "Черновик". Изменение структуры конкурсов недоступно.
            </p>
            <Link
              href={`/admin/events/${eventId}`}
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              ← Вернуться к мероприятию
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const csrfToken = await generateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: event.name, href: `/admin/events/${eventId}` },
            { label: 'Новый конкурс' }
          ]}
          className="mb-4"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Новый конкурс
          </h1>
          <p className="text-gray-600 mt-2">{event.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <ContestForm eventId={eventId} csrfToken={csrfToken} />
        </div>
      </div>
    </div>
  );
}
