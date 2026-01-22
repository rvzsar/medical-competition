/**
 * Certificate Designer Page - графический конструктор сертификатов
 */

import { requireAuth } from '@/lib/dal';
import { getEventById } from '@/services/eventService';
import { getDesignTemplate } from '@/services/certificateDesignService';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CertificateDesignerWrapper from './CertificateDesignerWrapper';

interface DesignerPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CertificateDesignerPage({ params }: DesignerPageProps) {
  await requireAuth(['Admin', 'Event_Manager']);

  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  // Загрузить существующий шаблон если есть
  const existingTemplate = await getDesignTemplate(eventId);

  return (
    <div className="h-screen flex flex-col">
      {/* Mini header */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/admin/events/${eventId}/certificates`}
            className="text-gray-300 hover:text-white"
          >
            ← Назад
          </Link>
          <span className="text-gray-400">|</span>
          <span className="font-medium">{event.name}</span>
        </div>
      </div>

      {/* Designer */}
      <div className="flex-1 overflow-hidden">
        <CertificateDesignerWrapper 
          eventId={eventId}
          initialTemplate={existingTemplate}
        />
      </div>
    </div>
  );
}
