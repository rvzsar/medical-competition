/**
 * Certificates Management Page - управление сертификатами мероприятия
 * 
 * Requirements: 10.1, 10.2
 */

import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getTeamsByEventId } from '@/services/teamService';
import { getParticipantsByEventId } from '@/services/participantService';
import { generateCSRFToken } from '@/lib/csrf';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CertificatesManager from '@/components/admin/CertificatesManager';
import Breadcrumbs from '@/components/Breadcrumbs';

interface CertificatesPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CertificatesPage({ params }: CertificatesPageProps) {
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
            { label: 'Сертификаты' }
          ]}
          className="mb-4"
        />

        <div className="mb-8">
          <Link 
            href={`/admin/events/${eventId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Назад к мероприятию
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Сертификаты: {event.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Генерация и отправка сертификатов участникам
          </p>
        </div>

        <CertificatesManager
          eventId={eventId}
          teams={teams}
          participants={participants}
          csrfToken={csrfToken}
        />
      </div>
    </div>
  );
}
