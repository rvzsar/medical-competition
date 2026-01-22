'use client';

/**
 * ScoreEntryModal - модальное окно ввода оценки
 * 
 * Requirements: 3.1, 3.4
 * UX: быстрый ввод, минимум кликов, keyboard shortcuts
 */

import { useState, useTransition, useEffect, useRef } from 'react';
import { submitBulkScore } from '@/actions/bulk-scoring';
import type { Contest, Score } from '@/types';
import type { ScoringEntity } from '@/types/bulk-scoring';

interface ScoreEntryModalProps {
  entity: ScoringEntity;
  juryId: string;
  juryName: string;
  eventId: string;
  contest: Contest;
  existingScore: Score | null;
  csrfToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScoreEntryModal({
  entity,
  juryId,
  juryName,
  eventId,
  contest,
  existingScore,
  csrfToken,
  onClose,
  onSuccess,
}: ScoreEntryModalProps) {
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number | boolean | string>>(() => {
    // Инициализация из существующей оценки
    if (existingScore?.criteriaScores) {
      const scores: Record<string, number | boolean | string> = {};
      for (const [key, value] of Object.entries(existingScore.criteriaScores)) {
        scores[key] = value as number | boolean | string;
      }
      return scores;
    }
    return {};
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Автофокус на первое поле
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Валидация одного критерия
  const validateCriterion = (criterionId: string, value: number | boolean | string | undefined): string | null => {
    const criterion = contest.criteria.find(c => c.id === criterionId);
    if (!criterion) return null;

    if (value === undefined) {
      return 'Введите значение';
    }

    if (criterion.type === 'numeric') {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Введите числовое значение';
      }
      const min = criterion.minValue ?? 0;
      const max = criterion.maxValue ?? 100;
      if (value < min || value > max) {
        return `Значение должно быть от ${min} до ${max}`;
      }
    }

    if (criterion.type === 'boolean' && typeof value !== 'boolean') {
      return 'Выберите значение';
    }

    if (criterion.type === 'dropdown') {
      if (typeof value !== 'string' || !criterion.options?.includes(value)) {
        return 'Выберите значение из списка';
      }
    }

    return null;
  };

  // Обработка изменения числового значения
  const handleNumericChange = (criterionId: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: numValue as number,
    }));

    // Валидация в реальном времени
    const error = validateCriterion(criterionId, numValue);
    setErrors(prev => ({
      ...prev,
      [criterionId]: error || '',
    }));
  };

  // Обработка изменения boolean значения
  const handleBooleanChange = (criterionId: string, value: boolean) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: value,
    }));
    setErrors(prev => ({
      ...prev,
      [criterionId]: '',
    }));
  };

  // Обработка изменения dropdown значения
  const handleDropdownChange = (criterionId: string, value: string) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: value,
    }));
    setErrors(prev => ({
      ...prev,
      [criterionId]: '',
    }));
  };

  // Расчёт итоговой оценки
  const calculateTotal = (): number => {
    let total = 0;
    for (const criterion of contest.criteria) {
      const value = criteriaScores[criterion.id];
      const weight = criterion.weight || 1;
      
      if (criterion.type === 'numeric' && typeof value === 'number' && !isNaN(value)) {
        total += value * weight;
      } else if (criterion.type === 'boolean' && typeof value === 'boolean') {
        total += (value ? (criterion.maxValue || 1) : 0) * weight;
      } else if (criterion.type === 'dropdown' && typeof value === 'string' && criterion.options) {
        const optionIndex = criterion.options.indexOf(value);
        if (optionIndex >= 0) {
          total += optionIndex * weight;
        }
      }
    }
    return Math.round(total * 10) / 10;
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Валидация всех критериев
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    for (const criterion of contest.criteria) {
      const error = validateCriterion(criterion.id, criteriaScores[criterion.id]);
      if (error) {
        newErrors[criterion.id] = error;
        hasErrors = true;
      }
    }

    setErrors(newErrors);
    if (hasErrors) return;

    startTransition(async () => {
      const result = await submitBulkScore(
        {
          participantId: entity.type === 'participant' ? entity.id : undefined,
          teamId: entity.type === 'team' ? entity.id : undefined,
          juryId,
          contestId: contest.id,
          criteriaScores,
        },
        eventId,
        csrfToken
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setSubmitError(result.error);
      }
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
            {existingScore ? 'Редактировать оценку' : 'Ввод оценки'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {entity.name} • {juryName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {contest.name}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {submitError}
            </div>
          )}

          {contest.criteria.map((criterion, index) => (
            <div key={criterion.id}>
              <label 
                htmlFor={`criterion-${criterion.id}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {criterion.name}
                {criterion.type === 'numeric' && (
                  <span className="text-gray-400 font-normal ml-1">
                    (макс: {criterion.maxValue ?? 100})
                  </span>
                )}
              </label>
              
              {/* Numeric input */}
              {criterion.type === 'numeric' && (
                <input
                  ref={index === 0 ? firstInputRef : undefined}
                  id={`criterion-${criterion.id}`}
                  type="number"
                  min={criterion.minValue ?? 0}
                  max={criterion.maxValue ?? 100}
                  step="0.1"
                  value={typeof criteriaScores[criterion.id] === 'number' ? criteriaScores[criterion.id] : ''}
                  onChange={(e) => handleNumericChange(criterion.id, e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors[criterion.id] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                    }
                  `}
                  aria-invalid={!!errors[criterion.id]}
                  aria-describedby={errors[criterion.id] ? `error-${criterion.id}` : undefined}
                />
              )}

              {/* Boolean input */}
              {criterion.type === 'boolean' && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`criterion-${criterion.id}`}
                      checked={criteriaScores[criterion.id] === true}
                      onChange={() => handleBooleanChange(criterion.id, true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Да</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`criterion-${criterion.id}`}
                      checked={criteriaScores[criterion.id] === false}
                      onChange={() => handleBooleanChange(criterion.id, false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Нет</span>
                  </label>
                </div>
              )}

              {/* Dropdown input */}
              {criterion.type === 'dropdown' && criterion.options && (
                <select
                  id={`criterion-${criterion.id}`}
                  value={typeof criteriaScores[criterion.id] === 'string' ? criteriaScores[criterion.id] : ''}
                  onChange={(e) => handleDropdownChange(criterion.id, e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors[criterion.id] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                    }
                  `}
                >
                  <option value="">-- Выберите --</option>
                  {criterion.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {errors[criterion.id] && (
                <p id={`error-${criterion.id}`} className="text-red-600 text-xs mt-1">
                  {errors[criterion.id]}
                </p>
              )}
              {criterion.description && (
                <p className="text-gray-500 text-xs mt-1">{criterion.description}</p>
              )}
            </div>
          ))}

          {/* Итого */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Итого:</span>
              <span className="text-xl font-bold text-blue-600">
                {calculateTotal()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Отмена
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Нажмите Escape для закрытия
          </p>
        </form>
      </div>
    </div>
  );
}
