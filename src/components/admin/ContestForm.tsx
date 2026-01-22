'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createContest, updateContest } from '@/actions/contests';
import type { Contest, Criteria, CriteriaType } from '@/types';

interface ContestFormProps {
  eventId: string;
  contest?: Contest;
  readOnly?: boolean;
  csrfToken: string;
}

export default function ContestForm({ eventId, contest, readOnly = false, csrfToken }: ContestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: contest?.name || '',
    description: contest?.description || '',
    timeLimit: contest?.timeLimit?.toString() || '',
  });

  const [criteria, setCriteria] = useState<Criteria[]>(
    contest?.criteria || [
      {
        id: crypto.randomUUID(),
        name: '',
        type: 'numeric' as CriteriaType,
        minValue: 0,
        maxValue: 10,
        weight: 1,
      },
    ]
  );

  const addCriteria = () => {
    setCriteria([
      ...criteria,
      {
        id: crypto.randomUUID(),
        name: '',
        type: 'numeric',
        minValue: 0,
        maxValue: 10,
        weight: 1,
      },
    ]);
  };

  const updateCriteria = (index: number, updates: Partial<Criteria>) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setCriteria(newCriteria);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    setError(null);

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
      criteria,
    };

    startTransition(async () => {
      const result = contest
        ? await updateContest(contest.id, data, csrfToken)
        : await createContest({
            ...data,
            eventId,
            order: 0,
          }, csrfToken);

      if (result.success) {
        router.push(`/admin/events/${eventId}`);
      } else {
        setError(result.error);
      }
    });
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Название</h3>
          <p className="mt-1 text-gray-900">{contest?.name}</p>
        </div>

        {contest?.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700">Описание</h3>
            <p className="mt-1 text-gray-900">{contest.description}</p>
          </div>
        )}

        {contest?.timeLimit && (
          <div>
            <h3 className="text-sm font-medium text-gray-700">Лимит времени</h3>
            <p className="mt-1 text-gray-900">{contest.timeLimit} минут</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Критерии оценки</h3>
          <div className="space-y-3">
            {contest?.criteria.map((c, idx) => (
              <div key={c.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Тип: {c.type === 'numeric' ? 'Числовой' : c.type === 'boolean' ? 'Да/Нет' : 'Выбор'}
                  {c.type === 'numeric' && ` (${c.minValue} - ${c.maxValue})`}
                  {c.type === 'dropdown' && ` (${c.options?.join(', ')})`}
                  {' • '}Вес: {c.weight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название конкурса
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Лимит времени (минуты)
        </label>
        <input
          type="number"
          value={formData.timeLimit}
          onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          min="1"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Критерии оценки
          </label>
          <button
            type="button"
            onClick={addCriteria}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Добавить критерий
          </button>
        </div>

        <div className="space-y-4">
          {criteria.map((criterion, index) => (
            <div key={criterion.id} className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Критерий {index + 1}</h4>
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriteria(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Удалить
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => updateCriteria(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Тип</label>
                  <select
                    value={criterion.type}
                    onChange={(e) => updateCriteria(index, { type: e.target.value as CriteriaType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="numeric">Числовой</option>
                    <option value="boolean">Да/Нет</option>
                    <option value="dropdown">Выбор из списка</option>
                  </select>
                </div>
              </div>

              {criterion.type === 'numeric' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Мин. значение</label>
                    <input
                      type="number"
                      value={criterion.minValue}
                      onChange={(e) => updateCriteria(index, { minValue: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Макс. значение</label>
                    <input
                      type="number"
                      value={criterion.maxValue}
                      onChange={(e) => updateCriteria(index, { maxValue: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Вес</label>
                    <input
                      type="number"
                      value={criterion.weight}
                      onChange={(e) => updateCriteria(index, { weight: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0.1"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              )}

              {criterion.type === 'dropdown' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Варианты (через запятую)
                  </label>
                  <input
                    type="text"
                    value={criterion.options?.join(', ') || ''}
                    onChange={(e) => updateCriteria(index, { 
                      options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Отлично, Хорошо, Удовлетворительно"
                    required
                  />
                </div>
              )}
            </div>
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
          {isPending ? 'Сохранение...' : contest ? 'Обновить' : 'Создать'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
