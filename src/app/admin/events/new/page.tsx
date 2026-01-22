/**
 * New Event Page - создание нового мероприятия
 * 
 * Requirements: 1.1
 */

import { requireAuth } from '@/lib/dal';
import { generateCSRFToken } from '@/lib/csrf';
import EventCreateForm from '@/components/admin/EventCreateForm';
import Breadcrumbs from '@/components/Breadcrumbs';

export default async function NewEventPage() {
  await requireAuth(['Admin', 'Event_Manager']);
  const csrfToken = await generateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: 'Новое мероприятие' }
          ]}
          className="mb-4"
        />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Создать новое мероприятие
        </h1>

        <EventCreateForm csrfToken={csrfToken} />
      </div>
    </div>
  );
}
