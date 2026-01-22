'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteContest, reorderContests } from '@/actions/contests';
import type { Contest } from '@/types';

interface ContestsListProps {
  contests: Contest[];
  eventId: string;
  canEdit: boolean;
  csrfToken: string;
}

export default function ContestsList({ contests, eventId, canEdit, csrfToken }: ContestsListProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (contestId: string, contestName: string) => {
    if (!confirm(`Удалить конкурс "${contestName}"?`)) return;
    if (isPending) return;

    setError(null);

    startTransition(async () => {
      const result = await deleteContest(contestId, csrfToken);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleReorder = async (contestId: string, direction: 'up' | 'down') => {
    const currentIndex = contests.findIndex(c => c.id === contestId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= contests.length) return;
    if (isPending) return;

    const reordered = [...contests];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    const contestOrders = reordered.map((c, idx) => ({
      contestId: c.id,
      order: idx,
    }));

    startTransition(async () => {
      const result = await reorderContests(eventId, contestOrders, csrfToken);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  if (contests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Конкурсы не добавлены
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {contests.map((contest, index) => (
          <div
            key={contest.id}
            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  #{contest.order + 1}
                </span>
                <h4 className="font-semibold text-gray-900">{contest.name}</h4>
              </div>
              {contest.description && (
                <p className="text-sm text-gray-600 mt-1">{contest.description}</p>
              )}
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Критериев: {contest.criteria.length}</span>
                {contest.maxScore && <span>Макс. балл: {contest.maxScore}</span>}
                {contest.timeLimit && <span>Время: {contest.timeLimit} мин</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={() => handleReorder(contest.id, 'up')}
                    disabled={index === 0 || isPending}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                    title="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleReorder(contest.id, 'down')}
                    disabled={index === contests.length - 1 || isPending}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                    title="Переместить вниз"
                  >
                    ↓
                  </button>
                  <Link
                    href={`/admin/events/${eventId}/contests/${contest.id}`}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800"
                  >
                    Редактировать
                  </Link>
                  <button
                    onClick={() => handleDelete(contest.id, contest.name)}
                    disabled={isPending}
                    className="px-3 py-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </>
              )}
              {!canEdit && (
                <Link
                  href={`/admin/events/${eventId}/contests/${contest.id}`}
                  className="px-3 py-1 text-blue-600 hover:text-blue-800"
                >
                  Просмотр
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
