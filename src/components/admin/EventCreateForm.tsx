'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/actions/events';

interface EventCreateFormProps {
  csrfToken: string;
}

export default function EventCreateForm({ csrfToken }: EventCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPending) return;

    startTransition(async () => {
      setError(null);

      const result = await createEvent({
        name: formData.name,
        description: formData.description || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      }, csrfToken);

      if (result.success) {
        router.push(`/admin/events/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6" aria-label="Форма создания мероприятия">
      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
          Название мероприятия *
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
          placeholder="Например: Медицинская олимпиада 2026"
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
          rows={4}
          maxLength={1000}
          placeholder="Краткое описание мероприятия..."
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ После создания мероприятие будет в статусе <strong>"Черновик"</strong>. 
          Вы сможете добавить конкурсы, участников и жюри перед активацией.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isPending ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Создание...
            </>
          ) : (
            'Создать мероприятие'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
