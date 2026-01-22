/**
 * Утилиты для работы с матрицей оценок
 * 
 * Requirements: 5.2, 6.1, 6.4
 */

import type { Score, JuryAssignment, Participant, Team } from '@/types';
import type { 
  ScoreMatrix, 
  ProgressStats, 
  AggregationMethod, 
  ScoringEntity,
  JuryAssignmentWithMember 
} from '@/types/bulk-scoring';

/**
 * Построить матрицу оценок из массива оценок
 * Property 6: Score Status Accuracy
 */
export function buildScoreMatrix(scores: Score[]): ScoreMatrix {
  const matrix: ScoreMatrix = {};
  
  for (const score of scores) {
    const entityId = score.participantId || score.teamId;
    if (!entityId) continue;
    
    if (!matrix[entityId]) {
      matrix[entityId] = {};
    }
    matrix[entityId][score.juryId] = score;
  }
  
  return matrix;
}

/**
 * Рассчитать статистику прогресса оценивания
 * Property 12: Progress Calculation Correctness
 */
export function calculateProgressStats(
  entities: ScoringEntity[],
  juryAssignments: JuryAssignment[] | JuryAssignmentWithMember[],
  scoreMatrix: ScoreMatrix
): ProgressStats {
  const totalParticipants = entities.length;
  const juryCount = juryAssignments.length;
  const totalCells = totalParticipants * juryCount;
  
  let filledCells = 0;
  let fullyEvaluated = 0;
  let partiallyEvaluated = 0;
  let notEvaluated = 0;
  
  for (const entity of entities) {
    const scores = scoreMatrix[entity.id] || {};
    const scoredCount = Object.values(scores).filter(s => s !== null).length;
    
    filledCells += scoredCount;
    
    if (scoredCount === juryCount && juryCount > 0) {
      fullyEvaluated++;
    } else if (scoredCount > 0) {
      partiallyEvaluated++;
    } else {
      notEvaluated++;
    }
  }
  
  const progressPercent = totalCells > 0 
    ? Math.round((filledCells / totalCells) * 100) 
    : 0;
  
  return {
    totalParticipants,
    fullyEvaluated,
    partiallyEvaluated,
    notEvaluated,
    progressPercent,
    totalCells,
    filledCells,
  };
}

/**
 * Рассчитать средний балл для участника
 * Property 13: Average Score Calculation
 */
export function calculateAverageScore(
  entityId: string,
  scoreMatrix: ScoreMatrix,
  contestId?: string
): number | null {
  const scores = scoreMatrix[entityId];
  if (!scores) return null;
  
  const values = Object.values(scores)
    .filter((s): s is Score => s !== null)
    .filter(s => !contestId || s.contestId === contestId)
    .map(s => s.totalScore);
  
  if (values.length === 0) return null;
  
  const sum = values.reduce((acc, v) => acc + v, 0);
  // Округление до 1 знака после запятой
  return Math.round((sum / values.length) * 10) / 10;
}

/**
 * Агрегировать оценки по методу
 * Property 14: Aggregation Method Correctness
 */
export function aggregateScores(
  scores: number[],
  method: AggregationMethod,
  weights?: number[]
): number {
  if (scores.length === 0) return 0;
  
  switch (method) {
    case 'sum':
      return scores.reduce((sum, v) => sum + v, 0);
    
    case 'weighted':
      if (!weights || weights.length !== scores.length) {
        // Fallback to average if weights invalid
        return scores.reduce((sum, v) => sum + v, 0) / scores.length;
      }
      const weightedSum = scores.reduce((sum, v, i) => sum + v * weights[i], 0);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    case 'average':
    default:
      return scores.reduce((sum, v) => sum + v, 0) / scores.length;
  }
}

/**
 * Преобразовать участников и команды в единый формат ScoringEntity
 */
export function toScoringEntities(
  participants: Participant[],
  teams: Team[]
): ScoringEntity[] {
  const entities: ScoringEntity[] = [];
  
  // Добавить участников (только тех, кто не в команде)
  for (const p of participants) {
    if (!p.teamId) {
      entities.push({
        id: p.id,
        name: `${p.lastName} ${p.firstName}${p.middleName ? ' ' + p.middleName : ''}`,
        type: 'participant',
        institution: p.institution,
        original: p,
      });
    }
  }
  
  // Добавить команды
  for (const t of teams) {
    entities.push({
      id: t.id,
      name: t.name,
      type: 'team',
      institution: t.institution,
      original: t,
    });
  }
  
  return entities;
}

/**
 * Получить статус оценивания для участника
 */
export function getEvaluationStatus(
  entityId: string,
  scoreMatrix: ScoreMatrix,
  juryCount: number
): 'complete' | 'partial' | 'none' {
  const scores = scoreMatrix[entityId];
  if (!scores) return 'none';
  
  const scoredCount = Object.values(scores).filter(s => s !== null).length;
  
  if (scoredCount === 0) return 'none';
  if (scoredCount >= juryCount) return 'complete';
  return 'partial';
}

/**
 * Фильтровать участников по конкурсу
 * Property 5: Contest Filtering Correctness
 */
export function filterEntitiesByContest(
  entities: ScoringEntity[],
  scoreMatrix: ScoreMatrix,
  contestId: string | 'all'
): ScoringEntity[] {
  if (contestId === 'all') return entities;
  
  // Фильтруем по наличию оценок в конкурсе или возвращаем всех
  // (участники могут быть зарегистрированы на конкурс без оценок)
  return entities;
}

/**
 * Получить оценки для конкретного конкурса
 */
export function getScoresForContest(
  scores: Score[],
  contestId: string
): Score[] {
  return scores.filter(s => s.contestId === contestId);
}

/**
 * Форматировать имя жюри
 */
export function formatJuryName(jury: { firstName: string; lastName: string; middleName?: string }): string {
  return `${jury.lastName} ${jury.firstName.charAt(0)}.${jury.middleName ? jury.middleName.charAt(0) + '.' : ''}`;
}

/**
 * Форматировать полное имя жюри
 */
export function formatJuryFullName(jury: { firstName: string; lastName: string; middleName?: string }): string {
  return `${jury.lastName} ${jury.firstName}${jury.middleName ? ' ' + jury.middleName : ''}`;
}
