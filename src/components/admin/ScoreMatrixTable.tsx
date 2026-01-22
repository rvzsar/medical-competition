'use client';

/**
 * ScoreMatrixTable - таблица матрицы оценок
 * 
 * Requirements: 2.1, 6.2
 * UX: sticky header, responsive, сортировка
 */

import { useMemo, useState } from 'react';
import ScoreCell from './ScoreCell';
import type { Score } from '@/types';
import type { ScoreMatrix, ScoringEntity, JuryAssignmentWithMember } from '@/types/bulk-scoring';
import { calculateAverageScore, getEvaluationStatus, formatJuryName } from '@/utils/scoring';

interface ScoreMatrixTableProps {
  entities: ScoringEntity[];
  juryAssignments: JuryAssignmentWithMember[];
  scoreMatrix: ScoreMatrix;
  selectedContestId: string | 'all';
  onCellClick: (entityId: string, juryId: string) => void;
}

type SortField = 'name' | 'average' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ScoreMatrixTable({
  entities,
  juryAssignments,
  scoreMatrix,
  selectedContestId,
  onCellClick,
}: ScoreMatrixTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Сортировка участников
  const sortedEntities = useMemo(() => {
    const sorted = [...entities];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ru');
          break;
        case 'average':
          const avgA = calculateAverageScore(a.id, scoreMatrix, selectedContestId === 'all' ? undefined : selectedContestId) ?? -1;
          const avgB = calculateAverageScore(b.id, scoreMatrix, selectedContestId === 'all' ? undefined : selectedContestId) ?? -1;
          comparison = avgA - avgB;
          break;
        case 'status':
          const statusOrder = { complete: 0, partial: 1, none: 2 };
          const statusA = getEvaluationStatus(a.id, scoreMatrix, juryAssignments.length);
          const statusB = getEvaluationStatus(b.id, scoreMatrix, juryAssignments.length);
          comparison = statusOrder[statusA] - statusOrder[statusB];
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [entities, sortField, sortDirection, scoreMatrix, selectedContestId, juryAssignments.length]);

  // Переключение сортировки
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Иконка сортировки
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Статус иконка
  const StatusIcon = ({ status }: { status: 'complete' | 'partial' | 'none' }) => {
    switch (status) {
      case 'complete':
        return <span className="text-green-600" title="Полностью оценено">✓</span>;
      case 'partial':
        return <span className="text-yellow-600" title="Частично оценено">⚠</span>;
      case 'none':
        return <span className="text-red-600" title="Не оценено">✗</span>;
    }
  };

  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📋</div>
        <p>Нет участников для отображения</p>
      </div>
    );
  }

  if (juryAssignments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">👥</div>
        <p>Жюри не назначено на это мероприятие</p>
        <p className="text-sm mt-1">Добавьте жюри во вкладке "Жюри"</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {/* Участник */}
            <th 
              className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left border-b border-r border-gray-200 min-w-[200px]"
            >
              <button
                onClick={() => toggleSort('name')}
                className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
              >
                Участник
                <SortIcon field="name" />
              </button>
            </th>
            
            {/* Колонки жюри */}
            {juryAssignments.map((ja) => (
              <th 
                key={ja.juryId} 
                className="px-3 py-3 text-center border-b border-gray-200 min-w-[100px]"
              >
                <div className="font-medium text-gray-700 text-sm">
                  {formatJuryName(ja.jury)}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[100px]" title={ja.jury.title}>
                  {ja.jury.title}
                </div>
              </th>
            ))}
            
            {/* Среднее */}
            <th 
              className="px-4 py-3 text-center bg-blue-50 border-b border-gray-200 min-w-[80px]"
            >
              <button
                onClick={() => toggleSort('average')}
                className="flex items-center justify-center font-semibold text-blue-700 hover:text-blue-900 w-full"
              >
                Среднее
                <SortIcon field="average" />
              </button>
            </th>
            
            {/* Статус */}
            <th 
              className="px-3 py-3 text-center border-b border-gray-200 w-16"
            >
              <button
                onClick={() => toggleSort('status')}
                className="flex items-center justify-center font-semibold text-gray-700 hover:text-gray-900 w-full"
              >
                <SortIcon field="status" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedEntities.map((entity, index) => {
            const average = calculateAverageScore(
              entity.id, 
              scoreMatrix, 
              selectedContestId === 'all' ? undefined : selectedContestId
            );
            const status = getEvaluationStatus(entity.id, scoreMatrix, juryAssignments.length);
            
            return (
              <tr 
                key={entity.id}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                `}
              >
                {/* Участник */}
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2 border-r border-gray-200">
                  <div className="font-medium text-gray-900">{entity.name}</div>
                  {entity.institution && (
                    <div className="text-xs text-gray-500 truncate max-w-[180px]" title={entity.institution}>
                      {entity.institution}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {entity.type === 'team' ? 'Команда' : 'Участник'}
                  </div>
                </td>
                
                {/* Ячейки оценок */}
                {juryAssignments.map((ja) => (
                  <ScoreCell
                    key={`${entity.id}-${ja.juryId}`}
                    entityId={entity.id}
                    juryId={ja.juryId}
                    score={scoreMatrix[entity.id]?.[ja.juryId] || null}
                    onClick={() => onCellClick(entity.id, ja.juryId)}
                  />
                ))}
                
                {/* Среднее */}
                <td className="px-4 py-2 text-center bg-blue-50/50 font-semibold">
                  {average !== null ? (
                    <span className="text-blue-700">{average.toFixed(1)}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                
                {/* Статус */}
                <td className="px-3 py-2 text-center">
                  <StatusIcon status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
