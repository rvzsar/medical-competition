'use client';

interface Event {
  id: string;
  name: string;
}

interface EventSelectorProps {
  events: Event[];
  selectedEventId: string;
}

export default function EventSelector({ events, selectedEventId }: EventSelectorProps) {
  return (
    <select
      className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
      value={selectedEventId}
      onChange={(e) => {
        window.location.href = `/results?eventId=${e.target.value}`;
      }}
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  );
}
