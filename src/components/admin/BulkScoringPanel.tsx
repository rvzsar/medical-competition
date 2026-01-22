'use client';

/**
 * BulkScoringPanel - главная панель массового ввода оценок
 * 
 * Requirements: 2.1, 2.2, 4.4
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ScoringHeader from './ScoringHeader';
import ScoreMatrixTable from './ScoreMatrixTable';
import ScoreEntryModal from './ScoreEntryModal';
import type { Event, Contest, Score, Participant, Team } from '@/types';
import type { JuryAssignmentWithMember, ScoringEntity, ScoreMatrix } from '@/types/bulk-scoring';
import { 
  buildScoreMatrix, 
  calculateProgressStats, 
  toScoringEntities,
  formatJuryFullName 
} from '@/utils/scoring';

interface BulkScoringPanelProps {
  event: Event;
  participants: Participant[];
  teams: Team[];
  juryAssignments: JuryAssignmentWithMember[];
  contests: Contest[];
  scores: Score[];
  csrfToken: string;
}

interface EditingCell {
  entityId: string;
  juryId: string;
}

export default function BulkScoringPanel({
  event,
  participants,
  teams,
  juryAssignments,
  contests,
  scores,
  csrfToken,
}: BulkScoringPanelProps) {
  const router = useRouter();
  const [selectedContestId, setSelectedContestId] = useState<string | 'all'>(
    contests.length === 1 ? contests[0].id : 'all'
  );
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // Преобразовать участников и команды в единый формат
  const entities = useMemo(() => 
    toScoringEntities(participants, teams),
    [participants, teams]
  );

  // Построить матрицу оценок
  const scoreMatrix = useMemo(() => 
    buildScoreMatrix(scores),
    [scores]
  );

  // Фильтровать оценки по выбранному конкурсу
  const filteredScoreMatrix = useMemo((): ScoreMatrix => {
    if (selectedContestId === 'all') return scoreMatrix;
    
    const filtered: ScoreMatrix = {};
    for (const [entityId, juryScores] of Object.entries(scoreMatrix)) {
      filtered[entityId] = {};
      const juryScoresTyped = juryScores as { [key: string]: Score | null };
      for (const [juryId, score] of Object.entries(juryScoresTyped)) {
        if (score && score.contestId === selectedContestId) {
          filtered[entityId][juryId] = score;
        }
      }
    }
    return filtered;
  }, [scoreMatrix, selectedContestId]);

  // Рассчитать статистику прогресса
  const stats = useMemo(() => 
    calculateProgressStats(entities, juryAssignments, filteredScoreMatrix),
    [entities, juryAssignments, filteredScoreMatrix]
  );

  // Обработчик клика по ячейке
  const handleCellClick = useCallback((entityId: string, juryId: string) => {
    setEditingCell({ entityId, juryId });
  }, []);

  // Обработчик успешного сохранения
  const handleSaveSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  // Получить данные для модального окна
  const getModalData = () => {
    if (!editingCell) return null;

    const entity = entities.find(e => e.id === editingCell.entityId);
    const juryAssignment = juryAssignments.find(ja => ja.juryId === editingCell.juryId);
    
    if (!entity || !juryAssignment) return null;

    // Определить конкурс для ввода оценки
    let contest: Contest | undefined;
    if (selectedContestId !== 'all') {
      contest = contests.find(c => c.id === selectedContestId);
    } else if (contests.length === 1) {
      contest = contests[0];
    }

    // Получить существующую оценку
    const existingScore = filteredScoreMatrix[editingCell.entityId]?.[editingCell.juryId] || null;

    return {
      entity,
      juryAssignment,
      contest,
      existingScore,
    };
  };

  const modalData = editingCell ? getModalData() : null;

  return (
    <div className="space-y-6">
      {/* Заголовок с фильтром и статистикой */}
      <ScoringHeader
        contests={contests}
        selectedContestId={selectedContestId}
        onContestChange={setSelectedContestId}
        stats={stats}
      />

      {/* Предупреждение если выбраны все конкурсы */}
      {selectedContestId === 'all' && contests.length > 1 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Выбраны все конкурсы. Для ввода оценок выберите конкретный конкурс.
          </p>
        </div>
      )}

      {/* Таблица матрицы оценок */}
      <ScoreMatrixTable
        entities={entities}
        juryAssignments={juryAssignments}
        scoreMatrix={filteredScoreMatrix}
        selectedContestId={selectedContestId}
        onCellClick={handleCellClick}
      />

      {/* Модальное окно ввода оценки */}
      {editingCell && modalData && modalData.contest && (
        <ScoreEntryModal
          entity={modalData.entity}
          juryId={editingCell.juryId}
          juryName={formatJuryFullName(modalData.juryAssignment.jury)}
          eventId={event.id}
          contest={modalData.contest}
          existingScore={modalData.existingScore}
          csrfToken={csrfToken}
          onClose={() => setEditingCell(null)}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Сообщение если нужно выбрать конкурс */}
      {editingCell && modalData && !modalData.contest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Выберите конкурс
            </h3>
            <p className="text-gray-600 mb-4">
              Для ввода оценки необходимо выбрать конкретный конкурс в фильтре выше.
            </p>
            <button
              onClick={() => setEditingCell(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Footer с кнопками экспорта */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          🖨️ Печать
        </button>
        {/* TODO: Реализовать экспорт в Excel */}
        <button
          disabled
          className="px-4 py-2 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
          title="Экспорт в Excel будет доступен позже"
        >
          📊 Экспорт Excel
        </button>
      </div>
    </div>
  );
}
