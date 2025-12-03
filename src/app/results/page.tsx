"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Team, AggregatedScore } from "@/types";
import { storageUtils } from "@/utils/serverStorage";
import ScoreDisplay from "@/components/ScoreDisplay";
import TotalScoreDisplay from "@/components/TotalScoreDisplay";
import { CONTESTS, PRACTICAL_STATIONS, MAX_TOTAL_SCORE } from "@/config/contests";

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [aggregatedScores, setAggregatedScores] = useState<AggregatedScore[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем команды и оценки с сервера
        const [savedTeams, savedScores] = await Promise.all([
          storageUtils.getTeams(),
          storageUtils.getAggregatedScores()
        ]);
        setTeams(savedTeams);
        setAggregatedScores(savedScores);
      } catch (error) {
        console.error('Error loading results data:', error);
      }
    };

    loadData();
  }, []);

  // Основные конкурсы (без practical-skills, т.к. он разбит на станции)
  const mainContests = CONTESTS.filter(c => c.id !== 'practical-skills').map(c => ({
    id: c.id,
    name: c.name,
    maxScore: c.maxScore,
  }));

  // Станции практических навыков
  const practicalStations = PRACTICAL_STATIONS.map(s => ({
    id: s.id,
    name: s.name,
    maxScore: s.maxScore,
  }));

  // Все конкурсы для детальной таблицы
  const allContests = [
    mainContests[0], // Визитка
    mainContests[1], // Клинический случай
    ...practicalStations, // 4 станции практических навыков
    mainContests[2], // Битва умов
    mainContests[3], // Вопрос от жюри
  ];

  const getTeamAggregatedScore = (teamId: string, contestId: string): AggregatedScore | undefined => {
    return aggregatedScores.find((s: AggregatedScore) => s.teamId === teamId && s.contestId === contestId);
  };

  const getTeamTotalFromState = (teamId: string): number => {
    const teamScores = aggregatedScores.filter((s: AggregatedScore) => s.teamId === teamId);
    const total = teamScores.reduce((sum: number, score: AggregatedScore) => sum + score.averageScore, 0);
    // Ограничиваем максимумом 60 баллов (Requirements: 9.1, 9.2)
    return Math.min(Math.round(total * 10) / 10, MAX_TOTAL_SCORE);
  };

  // Получение суммы баллов за практические навыки
  const getPracticalSkillsTotal = (teamId: string): number => {
    const stationIds = PRACTICAL_STATIONS.map((s) => s.id);
    return stationIds.reduce((sum: number, stationId: string) => {
      const score = aggregatedScores.find((s: AggregatedScore) => s.teamId === teamId && s.contestId === stationId);
      return sum + (score ? score.averageScore : 0);
    }, 0);
  };

  const sortedTeams = [...teams].sort((teamA, teamB) => {
    return getTeamTotalFromState(teamB.id) - getTeamTotalFromState(teamA.id);
  });

  const getPlaceColor = (place: number) => {
    switch (place) {
      case 1: return "bg-yellow-100 border-yellow-400";
      case 2: return "bg-gray-100 border-gray-400";
      case 3: return "bg-orange-100 border-orange-400";
      default: return "bg-white border-gray-200";
    }
  };

  const getPlaceBadge = (place: number) => {
    switch (place) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${place}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Результаты олимпиады</h1>
            <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              На главную
            </Link>
          </div>
        </header>

        {/* Общая таблица результатов */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Общие результаты</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Место</th>
                  <th className="text-left py-3 px-4">Команда</th>
                  <th className="text-left py-3 px-4">Участники</th>
                  <th className="text-center py-3 px-4">Общий балл</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, index) => (
                  <tr key={team.id} className={`border-b ${getPlaceColor(index + 1)}`}>
                    <td className="py-3 px-4 font-bold text-lg">
                      {getPlaceBadge(index + 1)}
                    </td>
                    <td className="py-3 px-4 font-semibold">{team.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {team.members.join(", ")}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-lg">
                      <TotalScoreDisplay teamId={team.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Детальная таблица по конкурсам */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Результаты по конкурсам</h2>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Как работает подсчет:</strong> Показывается средний балл от всех членов жюри, оценивших команду.
              Наведите на оценку, чтобы увидеть детальную информацию. Количество оценок указано в скобках.
            </p>
            <p className="text-sm text-blue-800 mt-1">
              📊 <strong>Максимальный балл:</strong> {MAX_TOTAL_SCORE} (Визитка: 6 + Клинический случай: 4 + Практические навыки: 48 + Битва умов: 2)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 sticky left-0 bg-white">Команда</th>
                  {allContests.map((contest) => (
                    <th key={contest.id} className="text-center py-3 px-1 min-w-[80px]">
                      <div className="text-xs">{contest.name}</div>
                      <div className="text-gray-500 text-xs">макс. {contest.maxScore}</div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-2 font-bold bg-blue-50">
                    <div>Практ.</div>
                    <div className="text-gray-500 text-xs">макс. 48</div>
                  </th>
                  <th className="text-center py-3 px-2 font-bold bg-green-50">
                    <div>Итого</div>
                    <div className="text-gray-500 text-xs">макс. {MAX_TOTAL_SCORE}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team) => (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-semibold sticky left-0 bg-white">{team.name}</td>
                    {allContests.map((contest) => {
                      const aggregatedScore = getTeamAggregatedScore(team.id, contest.id);
                      
                      return (
                        <ScoreDisplay
                          key={contest.id}
                          teamId={team.id}
                          contestId={contest.id}
                          aggregatedScore={aggregatedScore}
                        />
                      );
                    })}
                    <td className="text-center py-3 px-2 font-bold bg-blue-50">
                      {getPracticalSkillsTotal(team.id).toFixed(1)}
                    </td>
                    <td className="text-center py-3 px-2 font-bold text-lg bg-green-50">
                      <TotalScoreDisplay teamId={team.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Информация о наградах */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Награждение</h2>
          <div className="text-gray-700">
            <h3 className="font-semibold mb-2">Командные награды:</h3>
            <ul className="space-y-1 text-sm">
              <li>🥇 1 место - освобождение от экзамена с оценкой «отлично»</li>
              <li>🥈 2 место - +1 балл к экзамену</li>
              <li>🥉 3 место - +1 балл к экзамену</li>
              <li>🎬 Победитель конкурса «Визитка» - +1 балл к экзамену</li>
            </ul>
          </div>
        </div>

        {/* Легенда для понимания оценок */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Легенда оценок:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></span>
              <span className="text-gray-700">Зеленый - оценено 3+ членами жюри</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></span>
              <span className="text-gray-700">Желтый - оценено менее 3 членами жюри</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></span>
              <span className="text-gray-700">Серый - еще не оценено</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            *Число в скобках после оценки показывает, сколько членов жюри оценили команду
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/admin"
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
          >
            Вернуться в панель жюри
          </Link>
        </div>
      </div>
    </div>
  );
}