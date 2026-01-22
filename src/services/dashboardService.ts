/**
 * DashboardService - агрегация метрик для дашборда
 * 
 * Requirements: 6.1, 6.2, 6.5
 */

import type { Event, EventStatus } from '@/types';
import { getAllEvents, getEventsByStatus } from './eventService';
import { getContestsByEventId } from './contestService';
import { getTeamsByEventId } from './teamService';
import { getParticipantsByEventId } from './participantService';
import { getScoresByContestId } from './scoreService';

export interface EventMetrics {
  event: Event;
  contestsCount: number;
  teamsCount: number;
  participantsCount: number;
  scoresCount: number;
  completionPercentage: number;
}

/**
 * Вычислить метрики для списка мероприятий
 * Оптимизировано: избегает дублирования запросов getContestsByEventId
 */
async function calculateMetricsForEvents(events: Event[]): Promise<EventMetrics[]> {
  if (events.length === 0) {
    return [];
  }

  // Загрузить все данные параллельно для всех мероприятий
  const [contestsData, teamsData, participantsData] = await Promise.all([
    Promise.all(events.map(e => getContestsByEventId(e.id))),
    Promise.all(events.map(e => getTeamsByEventId(e.id))),
    Promise.all(events.map(e => getParticipantsByEventId(e.id))),
  ]);

  // Загрузить оценки используя уже полученные contests (избегаем дублирования)
  const scoresData = await Promise.all(
    contestsData.map(async (contests) => {
      const scores = await Promise.all(contests.map(c => getScoresByContestId(c.id)));
      return scores.flat().length;
    })
  );

  // Собрать метрики
  return events.map((event, index) => {
    const contests = contestsData[index];
    const teams = teamsData[index];
    const participants = participantsData[index];
    const scoresCount = scoresData[index];

    const expectedScores = contests.length * (teams.length || participants.length);
    const completionPercentage =
      expectedScores > 0 ? Math.round((scoresCount / expectedScores) * 100) : 0;

    return {
      event,
      contestsCount: contests.length,
      teamsCount: teams.length,
      participantsCount: participants.length,
      scoresCount,
      completionPercentage,
    };
  });
}

/**
 * Получить метрики для всех мероприятий
 */
export async function getAllEventsMetrics(): Promise<EventMetrics[]> {
  const events = await getAllEvents();
  return calculateMetricsForEvents(events);
}

/**
 * Получить метрики для мероприятий по статусу
 */
export async function getEventsMetricsByStatus(
  status: EventStatus
): Promise<EventMetrics[]> {
  const events = await getEventsByStatus(status);
  return calculateMetricsForEvents(events);
}

/**
 * Получить метрики для конкретного мероприятия
 */
export async function getEventMetrics(eventId: string): Promise<EventMetrics | null> {
  const allMetrics = await getAllEventsMetrics();
  return allMetrics.find((m) => m.event.id === eventId) || null;
}
