'use client';

/**
 * ScoringHeader - заголовок панели массового оценивания
 * 
 * Requirements: 4.1, 4.2, 5.2, 5.4
 * UX: быстрый обзор состояния, интуитивная фильтрация
 */

import type { Contest } from '@/types';
import type { ProgressStats } from '@/types/bulk-scoring';

interface ScoringHeaderProps {
  contests: Contest[];
  selectedContestId: string | 'all';
  onContestChange: (contestId: string | 'all') => void;
  stats: ProgressStats;
}

export default function ScoringHeader({
  contests,
  selectedContestId,
  onContestChange,
  stats,
}: ScoringHeaderProps) {
  // Цвет прогресс-бара в зависимости от процента
  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Фильтр и прогресс */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Выбор конкурса */}
        <div className="flex items-center gap-2">
          <label htmlFor="contest-filter" className="text-sm font-medium text-gray-700">
            Конкурс:
          </label>
          <select
            id="contest-filter"
            value={selectedContestId}
            onChange={(e) => onContestChange(e.target.value as string | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все конкурсы</option>
            {contests.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.name}
              </option>
            ))}
          </select>
        </div>

        {/* Прогресс-бар */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-sm text-gray-600">Прогресс:</span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(stats.progressPercent)}`}
              style={{ width: `${stats.progressPercent}%` }}
              role="progressbar"
              aria-valuenow={stats.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 min-w-[45px]">
            {stats.progressPercent}%
          </span>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Всего"
          value={stats.totalParticipants}
          color="blue"
        />
        <StatCard
          label="Оценено"
          value={stats.fullyEvaluated}
          color="green"
        />
        <StatCard
          label="Частично"
          value={stats.partiallyEvaluated}
          color="yellow"
        />
        <StatCard
          label="Не оценено"
          value={stats.notEvaluated}
          color="red"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`px-4 py-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
