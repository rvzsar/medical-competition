'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/actions/events';
import type { Event } from '@/types';

interface EventSelectorProps {
  onSelect: (eventId: string) => void;
  selectedEventId?: string;
}

export default function EventSelector({ onSelect, selectedEventId }: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const result = await getEvents();
    
    if (result.success) {
      setEvents(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет доступных мероприятий
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Выберите мероприятие
      </label>
      <select
        value={selectedEventId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">-- Выберите мероприятие --</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name} ({event.status === 'active' ? 'Активно' : event.status === 'completed' ? 'Завершено' : 'Черновик'})
          </option>
        ))}
      </select>
    </div>
  );
}
