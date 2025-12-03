"use client";

/**
 * Навигационная страница для конкурса "Практические навыки"
 * Перенаправляет на отдельные страницы станций для оценки
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, TeamScore, JuryMember } from "@/types";
import { storageUtils } from "@/utils/serverStorage";

export default function PracticalSkillsContestPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentJury, setCurrentJury] = useState<JuryMember | null>(null);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);

  const stations = [
    { id: "sutures", name: "Швы при кесаревом сечении", maxScore: 12, path: "/admin/contest/practical-skills/sutures" },
    { id: "outpatient", name: "Амбулаторный прием", maxScore: 12, path: "/admin/contest/practical-skills/outpatient" },
    { id: "obstetric", name: "Акушерское пособие в родах", maxScore: 12, path: "/admin/contest/practical-skills/obstetric" },
    { id: "laparoscopy", name: "Лапароскопический симулятор", maxScore: 12, path: "/admin/contest/practical-skills/laparoscopy" },
  ];

  useEffect(() => {
    const loadData = async () => {
      const jury = storageUtils.getCurrentJury();
      if (!jury) {
        router.push('/login');
        return;
      }
      setCurrentJury(jury);

      try {
        const savedTeams = await storageUtils.getTeams();
        setTeams(savedTeams);

        const contestScores = await storageUtils.getTeamScores();
        // Загружаем оценки по всем станциям практических навыков
        const stationIds = stations.map(s => s.id);
        const practicalScores = contestScores.filter(score => stationIds.includes(score.contestId));
        setTeamScores(practicalScores);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Получить оценку команды по станции от текущего жюри
  const getMyScoreForStation = (teamId: string, stationId: string): number | null => {
    if (!currentJury) return null;
    const score = teamScores.find(
      s => s.teamId === teamId && s.contestId === stationId && s.juryId === currentJury.id
    );
    return score ? score.score : null;
  };

  // Получить среднюю оценку команды по станции
  const getAverageScoreForStation = (teamId: string, stationId: string): number => {
    const stationScores = teamScores.filter(s => s.teamId === teamId && s.contestId === stationId);
    if (stationScores.length === 0) return 0;
    const total = stationScores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / stationScores.length) * 10) / 10;
  };

  // Получить общую оценку команды по всем станциям
  const getTotalScore = (teamId: string): number => {
    return stations.reduce((sum, station) => sum + getAverageScoreForStation(teamId, station.id), 0);
  };

  // Проверить, оценил ли текущий жюри все станции для команды
  const hasJuryRatedAllStations = (teamId: string): boolean => {
    if (!currentJury) return false;
    return stations.every(station => 
      teamScores.some(s => s.teamId === teamId && s.contestId === station.id && s.juryId === currentJury.id)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">III конкурс. Практические навыки</h1>
              <p className="text-gray-600 mt-2">Оценка практических навыков на 4 станциях (макс. 48 баллов)</p>
              {currentJury && (
                <p className="text-sm text-blue-600 mt-1">Оценивает: {currentJury.name}</p>
              )}
            </div>
            <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
              Назад к панели жюри
            </Link>
          </div>
        </header>

        {/* Станции для оценки */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Выберите станцию для оценки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stations.map((station) => (
              <Link
                key={station.id}
                href={station.path}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300"
              >
                <h3 className="font-semibold text-gray-800 mb-2">{station.name}</h3>
                <p className="text-sm text-gray-500 mb-3">Максимум: {station.maxScore} баллов</p>
                <div className="text-blue-600 font-medium text-sm">
                  Перейти к оценке →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Сводка по командам */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Сводка оценок по командам</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Команда</th>
                  {stations.map(station => (
                    <th key={station.id} className="text-center py-3 px-2">{station.name.split(' ')[0]}</th>
                  ))}
                  <th className="text-center py-3 px-2 font-bold">Итого</th>
                  <th className="text-center py-3 px-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const allRated = hasJuryRatedAllStations(team.id);
                  return (
                    <tr key={team.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{team.name}</td>
                      {stations.map(station => {
                        const myScore = getMyScoreForStation(team.id, station.id);
                        const avgScore = getAverageScoreForStation(team.id, station.id);
                        return (
                          <td key={station.id} className="text-center py-3 px-2">
                            <div className="flex flex-col">
                              <span className={myScore !== null ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                                {myScore !== null ? myScore : '—'}
                              </span>
                              {avgScore > 0 && (
                                <span className="text-xs text-gray-500">ср: {avgScore}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="text-center py-3 px-2">
                        <span className="font-bold text-lg">{Math.round(getTotalScore(team.id) * 10) / 10}</span>
                        <span className="text-gray-500">/48</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {allRated ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Оценено
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Не завершено
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>• Синим цветом показаны ваши оценки</p>
            <p>• "ср:" — средняя оценка от всех членов жюри</p>
          </div>
        </div>
      </div>
    </div>
  );
}
