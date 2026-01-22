'use client';

import { useState, useTransition } from 'react';
import { updateEvent, updateEventStatus } from '@/actions/events';
import type { Event } from '@/types';

interface EventFormProps {
  event: Event;
  csrfToken: string;
}

export default function EventForm({ event, csrfToken }: EventFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description || '',
    startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
    endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submit
    if (isPending) return;
    
    startTransition(async () => {
      setError(null);

      const result = await updateEvent(event.id, {
        name: formData.name,
        description: formData.description || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      }, csrfToken);

      if (result.success) {
        setIsEditing(false);
      } else {
        setError(result.error);
      }
    });
  };

  const handleStatusChange = async (newStatus: Event['status']) => {
    if (!confirm(`Изменить статус на "${newStatus}"?`)) return;
    
    // Prevent double submit
    if (isPending) return;

    startTransition(async () => {
      const result = await updateEventStatus(event.id, newStatus, csrfToken);

      if (!result.success) {
        setError(result.error);
      }
    });
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        <button
          onClick={() => setIsEditing(true)}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Редактировать
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('draft')}
            disabled={event.status === 'draft' || isPending}
            aria-busy={isPending}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Черновик
          </button>
          <button
            onClick={() => handleStatusChange('active')}
            disabled={event.status === 'active' || isPending}
            aria-busy={isPending}
            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Активировать
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={event.status === 'completed' || isPending}
            aria-busy={isPending}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Завершить
          </button>
          <button
            onClick={() => handleStatusChange('archived')}
            disabled={event.status === 'archived' || isPending}
            aria-busy={isPending}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Архивировать
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Форма редактирования мероприятия">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      
      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
          Название
        </label>
        <input
          type="text"
          id="event-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          aria-required="true"
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          id="event-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Дата начала
          </label>
          <input
            type="date"
            id="event-start-date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="event-end-date" className="block text-sm font-medium text-gray-700 mb-1">
            Дата окончания
          </label>
          <input
            type="date"
            id="event-end-date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={formData.startDate}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Сохранение...
            </>
          ) : (
            'Сохранить'
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={isPending}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
