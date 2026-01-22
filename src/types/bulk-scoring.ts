/**
 * Типы для массового ввода оценок жюри
 * 
 * Requirements: 2.1, 5.4, 6.1
 */

import type { Score, JuryAssignment, JuryMember, Participant, Team } from './index';

/**
 * Назначение жюри с данными о члене жюри
 */
export interface JuryAssignmentWithMember extends JuryAssignment {
  jury: JuryMember;
}

/**
 * Матрица оценок: participantId/teamId -> juryId -> Score
 */
export interface ScoreMatrix {
  [entityId: string]: {
    [juryId: string]: Score | null;
  };
}

/**
 * Статистика прогресса оценивания
 */
export interface ProgressStats {
  totalParticipants: number;
  fullyEvaluated: number;
  partiallyEvaluated: number;
  notEvaluated: number;
  progressPercent: number;
  totalCells: number;
  filledCells: number;
}

/**
 * Строка экспорта для Excel
 */
export interface ExportRow {
  participantName: string;
  participantId: string;
  institution?: string;
  contestName: string;
  juryScores: { juryName: string; score: number | null }[];
  averageScore: number | null;
  status: 'complete' | 'partial' | 'none';
}

/**
 * Данные для отправки оценки через bulk scoring
 */
export interface BulkScoreSubmission {
  participantId?: string;
  teamId?: string;
  juryId: string;
  contestId: string;
  criteriaScores: Record<string, number | boolean | string>;
}

/**
 * Метод агрегации оценок
 */
export type AggregationMethod = 'average' | 'sum' | 'weighted';

/**
 * Участник или команда для отображения в матрице
 */
export interface ScoringEntity {
  id: string;
  name: string;
  type: 'participant' | 'team';
  institution?: string;
  original: Participant | Team;
}

/**
 * Ячейка матрицы оценок
 */
export interface ScoreCellData {
  entityId: string;
  juryId: string;
  score: Score | null;
  contestId: string;
}
