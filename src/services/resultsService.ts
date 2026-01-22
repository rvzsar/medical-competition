/**
 * ResultsService - ранжирование и результаты
 * 
 * Requirements: 7.1, 7.2, 7.5
 */

import type { Team, Participant, Contest, Score } from '@/types';
import { getContestsByEventId } from './contestService';
import { getTeamsByEventId } from './teamService';
import { getParticipantsByEventId } from './participantService';
import { calculateAggregatedScore, getAllScoresByEventId } from './scoreService';

export interface ParticipantResult {
  rank: number;
  teamId?: string;
  participantId?: string;
  name: string;
  institution?: string;
  totalScore: number;
  contestScores: Array<{
    contestId: string;
    contestName: string;
    score: number;
    juryBreakdown: Array<{
      juryId: string;
      juryName: string;
      score: number;
    }>;
  }>;
}

/**
 * Вычислить агрегированные оценки из предзагруженных данных
 * Избегает N+1 запросов к Redis
 */
function calculateAggregatedFromScores(
  scores: Score[],
  contestId: string,
  teamId?: string,
  participantId?: string
): { averageScore: number; juryScores: Array<{ juryId: string; juryName: string; score: number }> } | null {
  const relevantScores = scores.filter((s) => {
    if (s.contestId !== contestId) return false;
    if (teamId) return s.teamId === teamId;
    if (participantId) return s.participantId === participantId;
    return false;
  });

  if (relevantScores.length === 0) {
    return null;
  }

  const totalSum = relevantScores.reduce((sum, s) => sum + s.totalScore, 0);
  const averageScore = totalSum / relevantScores.length;

  const juryScores = relevantScores.map((s) => ({
    juryId: s.juryId,
    juryName: s.juryId,
    score: s.totalScore,
  }));

  return { averageScore, juryScores };
}

/**
 * Получить результаты мероприятия с ранжированием
 * Оптимизировано: batch загрузка всех оценок для избежания N+1
 */
export async function getEventResults(eventId: string): Promise<ParticipantResult[]> {
  // Загрузить все данные параллельно одним batch запросом
  const [contests, teams, participants, allScores] = await Promise.all([
    getContestsByEventId(eventId),
    getTeamsByEventId(eventId),
    getParticipantsByEventId(eventId),
    getAllScoresByEventId(eventId),
  ]);

  const results: ParticipantResult[] = [];

  // Обработать команды (без дополнительных запросов к Redis)
  for (const team of teams) {
    const contestScores = contests.map((contest) => {
      const aggregated = calculateAggregatedFromScores(allScores, contest.id, team.id);

      return {
        contestId: contest.id,
        contestName: contest.name,
        score: aggregated?.averageScore || 0,
        juryBreakdown: aggregated?.juryScores || [],
      };
    });

    const totalScore = contestScores.reduce((sum, cs) => sum + cs.score, 0);

    results.push({
      rank: 0,
      teamId: team.id,
      name: team.name,
      institution: team.institution,
      totalScore,
      contestScores,
    });
  }

  // Обработать индивидуальных участников
  for (const participant of participants) {
    if (participant.teamId) continue;

    const contestScores = contests.map((contest) => {
      const aggregated = calculateAggregatedFromScores(
        allScores,
        contest.id,
        undefined,
        participant.id
      );

      return {
        contestId: contest.id,
        contestName: contest.name,
        score: aggregated?.averageScore || 0,
        juryBreakdown: aggregated?.juryScores || [],
      };
    });

    const totalScore = contestScores.reduce((sum, cs) => sum + cs.score, 0);

    results.push({
      rank: 0,
      participantId: participant.id,
      name: `${participant.lastName} ${participant.firstName}`,
      institution: participant.institution,
      totalScore,
      contestScores,
    });
  }

  // Применить tiebreaker и установить ранги
  return applyTiebreaker(results);
}

/**
 * Получить результаты конкретного конкурса
 * Оптимизировано: batch загрузка оценок
 */
export async function getContestResults(
  contestId: string
): Promise<ParticipantResult[]> {
  // Получить contest чтобы узнать eventId
  const { getContestById } = await import('./contestService');
  const contest = await getContestById(contestId);

  if (!contest) {
    return [];
  }

  // Загрузить все данные параллельно
  const [teams, participants, allScores] = await Promise.all([
    getTeamsByEventId(contest.eventId),
    getParticipantsByEventId(contest.eventId),
    getAllScoresByEventId(contest.eventId),
  ]);

  const results: ParticipantResult[] = [];

  // Обработать команды
  for (const team of teams) {
    const aggregated = calculateAggregatedFromScores(allScores, contestId, team.id);

    if (!aggregated) continue;

    results.push({
      rank: 0,
      teamId: team.id,
      name: team.name,
      institution: team.institution,
      totalScore: aggregated.averageScore,
      contestScores: [
        {
          contestId: contest.id,
          contestName: contest.name,
          score: aggregated.averageScore,
          juryBreakdown: aggregated.juryScores,
        },
      ],
    });
  }

  // Обработать участников
  for (const participant of participants) {
    if (participant.teamId) continue;

    const aggregated = calculateAggregatedFromScores(
      allScores,
      contestId,
      undefined,
      participant.id
    );

    if (!aggregated) continue;

    results.push({
      rank: 0,
      participantId: participant.id,
      name: `${participant.lastName} ${participant.firstName}`,
      institution: participant.institution,
      totalScore: aggregated.averageScore,
      contestScores: [
        {
          contestId: contest.id,
          contestName: contest.name,
          score: aggregated.averageScore,
          juryBreakdown: aggregated.juryScores,
        },
      ],
    });
  }

  // Применить tiebreaker и установить ранги
  return applyTiebreaker(results);
}

/**
 * Tiebreaker: при равных баллах сравнить по первому конкурсу
 */
export function applyTiebreaker(results: ParticipantResult[]): ParticipantResult[] {
  const sorted = [...results];

  sorted.sort((a, b) => {
    // Сначала по общему баллу
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // При равенстве - по первому конкурсу
    const aFirstScore = a.contestScores[0]?.score || 0;
    const bFirstScore = b.contestScores[0]?.score || 0;

    return bFirstScore - aFirstScore;
  });

  // Пересчитать ранги
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prevTotal = sorted[i - 1].totalScore;
      const prevFirst = sorted[i - 1].contestScores[0]?.score || 0;
      const currTotal = sorted[i].totalScore;
      const currFirst = sorted[i].contestScores[0]?.score || 0;

      if (currTotal < prevTotal || (currTotal === prevTotal && currFirst < prevFirst)) {
        currentRank = i + 1;
      }
    }
    sorted[i].rank = currentRank;
  }

  return sorted;
}
