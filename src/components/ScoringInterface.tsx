'use client';

import { useState, useTransition } from 'react';
import { submitScore } from '@/actions/scores';
import type { Contest, Team, Participant } from '@/types';

interface ScoringInterfaceProps {
  contest: Contest;
  teams: Team[];
  participants: Participant[];
  juryId: string;
  csrfToken: string;
  scoredTeamIds?: string[];
  scoredParticipantIds?: string[];
}

export default function ScoringInterface({ 
  contest, 
  teams, 
  participants, 
  juryId, 
  csrfToken,
  scoredTeamIds = [],
  scoredParticipantIds = [],
}: ScoringInterfaceProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number | boolean | string>>({});
  const [bonusPoints, setBonusPoints] = useState<string>('');
  const [penaltyPoints, setPenaltyPoints] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasTeams = teams.length > 0;
  const hasParticipants = participants.length > 0;
  
  // Фильтруем уже оценённых
  const availableTeams = teams.filter((t) => !scoredTeamIds.includes(t.id));
  const availableParticipants = participants.filter((p) => !scoredParticipantIds.includes(p.id));
  
  // Проверяем есть ли кого оценивать
  const allScored = (hasTeams && availableTeams.length === 0) || 
                    (hasParticipants && !hasTeams && availableParticipants.length === 0);

  const handleCriteriaChange = (criteriaId: string, value: number | boolean | string) => {
    setCriteriaScores({
      ...criteriaScores,
      [criteriaId]: value,
    });
  };

  const calculateTotalScore = (): number => {
    let total = 0;

    contest.criteria.forEach((criterion) => {
      const value = criteriaScores[criterion.id];
      const weight = criterion.weight || 1;

      if (criterion.type === 'numeric' && typeof value === 'number') {
        total += value * weight;
      } else if (criterion.type === 'boolean' && typeof value === 'boolean') {
        total += (value ? (criterion.maxValue || 1) : 0) * weight;
      } else if (criterion.type === 'dropdown' && typeof value === 'string') {
        // Для dropdown можно назначить баллы по индексу опции
        const optionIndex = criterion.options?.indexOf(value) ?? -1;
        if (optionIndex >= 0) {
          total += optionIndex * weight;
        }
      }
    });

    // Добавить бонусы и вычесть штрафы
    if (bonusPoints) total += parseFloat(bonusPoints);
    if (penaltyPoints) total -= parseFloat(penaltyPoints);

    return Math.max(0, total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    setError(null);
    setSuccess(false);

    // Проверить что все критерии заполнены
    const allFilled = contest.criteria.every(c => criteriaScores[c.id] !== undefined);
    if (!allFilled) {
      setError('Заполните все критерии оценки');
      return;
    }

    startTransition(async () => {
      const result = await submitScore({
        eventId: contest.eventId,
        contestId: contest.id,
        teamId: hasTeams ? selectedTeamId : undefined,
        participantId: hasParticipants ? selectedParticipantId : undefined,
        juryId,
        criteriaScores,
        bonusPoints: bonusPoints ? parseFloat(bonusPoints) : undefined,
        penaltyPoints: penaltyPoints ? parseFloat(penaltyPoints) : undefined,
        notes: notes || undefined,
      }, csrfToken);

      if (result.success) {
        setSuccess(true);
        // Сбросить форму
        setCriteriaScores({});
        setBonusPoints('');
        setPenaltyPoints('');
        setNotes('');
        setSelectedTeamId('');
        setSelectedParticipantId('');
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {allScored ? (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-green-600 text-4xl mb-2">✓</div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">
            Все оценки выставлены
          </h3>
          <p className="text-green-700">
            Вы оценили всех участников в этом конкурсе.
          </p>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Оценка успешно сохранена!
          </div>
        )}

        {/* Выбор команды или участника */}
        {hasTeams && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Команда
              {scoredTeamIds.length > 0 && (
                <span className="text-gray-500 font-normal ml-2">
                  (оценено: {scoredTeamIds.length} из {teams.length})
                </span>
              )}
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">-- Выберите команду --</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasParticipants && !hasTeams && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Участник
              {scoredParticipantIds.length > 0 && (
                <span className="text-gray-500 font-normal ml-2">
                  (оценено: {scoredParticipantIds.length} из {participants.length})
                </span>
              )}
            </label>
            <select
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">-- Выберите участника --</option>
              {availableParticipants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.lastName} {participant.firstName} {participant.middleName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Критерии оценки */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Критерии оценки</h3>
          
          {contest.criteria.map((criterion) => (
            <div key={criterion.id} className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {criterion.name}
                {criterion.description && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({criterion.description})
                  </span>
                )}
              </label>

              {criterion.type === 'numeric' && (
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={criteriaScores[criterion.id] as number || ''}
                    onChange={(e) => handleCriteriaChange(criterion.id, parseFloat(e.target.value))}
                    min={criterion.minValue}
                    max={criterion.maxValue}
                    step="0.1"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    ({criterion.minValue} - {criterion.maxValue})
                  </span>
                </div>
              )}

              {criterion.type === 'boolean' && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={criterion.id}
                      checked={criteriaScores[criterion.id] === true}
                      onChange={() => handleCriteriaChange(criterion.id, true)}
                      required
                    />
                    <span>Да</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={criterion.id}
                      checked={criteriaScores[criterion.id] === false}
                      onChange={() => handleCriteriaChange(criterion.id, false)}
                      required
                    />
                    <span>Нет</span>
                  </label>
                </div>
              )}

              {criterion.type === 'dropdown' && (
                <select
                  value={criteriaScores[criterion.id] as string || ''}
                  onChange={(e) => handleCriteriaChange(criterion.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите --</option>
                  {criterion.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Бонусы и штрафы */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Бонусные баллы
            </label>
            <input
              type="number"
              value={bonusPoints}
              onChange={(e) => setBonusPoints(e.target.value)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Штрафные баллы
            </label>
            <input
              type="number"
              value={penaltyPoints}
              onChange={(e) => setPenaltyPoints(e.target.value)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0"
            />
          </div>
        </div>

        {/* Комментарии */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Комментарии
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Дополнительные комментарии..."
          />
        </div>

        {/* Итоговый балл */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-700 mb-1">Итоговый балл:</div>
          <div className="text-3xl font-bold text-blue-600">
            {calculateTotalScore().toFixed(2)}
          </div>
        </div>

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          aria-busy={isPending}
        >
          {isPending ? 'Сохранение...' : 'Сохранить оценку'}
        </button>
      </form>
      )}
    </div>
  );
}
