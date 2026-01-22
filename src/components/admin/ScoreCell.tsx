'use client';

/**
 * ScoreCell - ячейка матрицы оценок
 * 
 * Requirements: 2.6, 5.1, 5.5
 * UX: визуальная обратная связь, accessibility, keyboard navigation
 */

import type { Score } from '@/types';

interface ScoreCellProps {
  entityId: string;
  juryId: string;
  score: Score | null;
  onClick: () => void;
  disabled?: boolean;
}

export default function ScoreCell({ 
  entityId, 
  juryId, 
  score, 
  onClick,
  disabled = false 
}: ScoreCellProps) {
  const hasScore = score !== null;
  const displayScore = score?.totalScore;

  // Форматирование даты для tooltip
  const dateStr = score?.submittedAt 
    ? new Date(score.submittedAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Tooltip content
  const tooltipContent = hasScore
    ? `Оценка: ${displayScore}\nДата: ${dateStr}`
    : 'Нет оценки — нажмите для ввода';

  return (
    <td className="p-0">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full h-full min-h-[48px] px-3 py-2
          text-center font-medium
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${hasScore 
            ? 'bg-green-50 hover:bg-green-100 text-green-800' 
            : 'bg-red-50 hover:bg-red-100 text-gray-400'
          }
        `}
        title={tooltipContent}
        aria-label={hasScore 
          ? `Оценка ${displayScore}, нажмите для редактирования` 
          : 'Нет оценки, нажмите для ввода'
        }
      >
        {hasScore ? (
          <span className="text-sm font-semibold">
            {typeof displayScore === 'number' ? displayScore.toFixed(1) : displayScore}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </button>
    </td>
  );
}
