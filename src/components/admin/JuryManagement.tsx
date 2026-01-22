'use client';

import { useState, useTransition } from 'react';
import { createJuryMember, assignJuryToEvent } from '@/actions/jury';
import type { Contest, JuryAssignment } from '@/types';

interface JuryManagementProps {
  eventId: string;
  contests: Contest[];
  assignments: JuryAssignment[];
  csrfToken: string;
}

export default function JuryManagement({ eventId, contests, assignments, csrfToken }: JuryManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [juryForm, setJuryForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    title: '',
    institution: '',
    contactEmail: '',
  });
  const [selectedContests, setSelectedContests] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    setError(null);

    startTransition(async () => {
      // Создать члена жюри
      const createResult = await createJuryMember(juryForm, csrfToken);

      if (!createResult.success) {
        setError(createResult.error);
        return;
      }

      // Назначить на мероприятие и конкурсы
      if (selectedContests.length > 0) {
        const assignResult = await assignJuryToEvent({
          juryId: createResult.data.id,
          eventId,
          contestIds: selectedContests,
        }, csrfToken);

        if (!assignResult.success) {
          setError(assignResult.error);
          return;
        }
      }

      setShowForm(false);
      setJuryForm({
        firstName: '',
        lastName: '',
        middleName: '',
        title: '',
        institution: '',
        contactEmail: '',
      });
      setSelectedContests([]);
    });
  };

  const toggleContest = (contestId: string) => {
    setSelectedContests(prev =>
      prev.includes(contestId)
        ? prev.filter(id => id !== contestId)
        : [...prev, contestId]
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Добавить члена жюри
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">Новый член жюри</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
              <input
                type="text"
                value={juryForm.lastName}
                onChange={(e) => setJuryForm({ ...juryForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                value={juryForm.firstName}
                onChange={(e) => setJuryForm({ ...juryForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
              <input
                type="text"
                value={juryForm.middleName}
                onChange={(e) => setJuryForm({ ...juryForm, middleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность/звание</label>
              <input
                type="text"
                value={juryForm.title}
                onChange={(e) => setJuryForm({ ...juryForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Учреждение</label>
              <input
                type="text"
                value={juryForm.institution}
                onChange={(e) => setJuryForm({ ...juryForm, institution: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={juryForm.contactEmail}
              onChange={(e) => setJuryForm({ ...juryForm, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Назначить на конкурсы
            </label>
            <div className="space-y-2">
              {contests.map((contest) => (
                <label key={contest.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedContests.includes(contest.id)}
                    onChange={() => toggleContest(contest.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{contest.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              aria-busy={isPending}
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Назначенное жюри ({assignments.length})</h3>
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Жюри ID: {assignment.juryId}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Назначен на {assignment.contestIds.length} конкурс(ов)
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(assignment.assignedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
