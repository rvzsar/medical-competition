"use client";

/**
 * Станция "Амбулаторный прием"
 * Requirements: 4.1, 4.2
 * - Критерии: профессионализм (0-3), техника и коммуникация (0-5), завершение приема (0-4)
 * - Максимум: 12 баллов
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, TeamScore, JuryMember } from "@/types";
import { storageUtils } from "@/utils/serverStorage";
import { getStationById } from "@/config/contests";

interface OutpatientStationScore {
  professionalism: number;
  technique: number;
  completion: number;
}

export default function OutpatientStationPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentJury, setCurrentJury] = useState<JuryMember | null>(null);
  const [scores, setScores] = useState<{ [key: string]: OutpatientStationScore }>({});
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<OutpatientStationScore>({
    professionalism: 0,
    technique: 0,
    completion: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const station = getStationById('outpatient');
  const contestId = 'outpatient'; // ID станции для хранения оценок

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
        const stationScores = contestScores.filter(score => score.contestId === contestId);
        setTeamScores(stationScores);

        const juryScores = stationScores.filter(score => score.juryId === jury.id);
        const juryScoresMap: { [key: string]: OutpatientStationScore } = {};
        
        juryScores.forEach(score => {
          if (score.details) {
            juryScoresMap[score.teamId] = score.details as OutpatientStationScore;
          }
        });
        
        setScores(juryScoresMap);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  /**
   * Расчет итогового балла для станции амбулаторного приема
   * Requirements 4.1, 4.2: максимум 12 баллов
   */
  const calculateTotal = (score: OutpatientStationScore): number => {
    return score.professionalism + score.technique + score.completion;
  };

  const saveScore = async () => {
    if (!selectedTeam || !currentJury) return;

    const teamScore: TeamScore = {
      teamId: selectedTeam,
      contestId: contestId,
      juryId: currentJury.id,
      score: calculateTotal(currentScore),
      details: currentScore,
      completedAt: new Date()
    };

    try {
      await storageUtils.addTeamScore(teamScore);
      
      setScores({
        ...scores,
        [selectedTeam]: { ...currentScore },
      });

      const updatedScores = await storageUtils.getTeamScores();
      const stationScores = updatedScores.filter(score => score.contestId === contestId);
      setTeamScores(stationScores);

      const action = isEditing ? 'обновлена' : 'сохранена';
      alert(`Оценка для команды ${teams.find(t => t.id === selectedTeam)?.name} ${action}!`);
      
      setSelectedTeam("");
      setCurrentScore({ professionalism: 0, technique: 0, completion: 0 });
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving score:', error);
      const message =
        error instanceof Error && error.message.includes('заблокировано')
          ? 'Изменение оценок заблокировано организатором.'
          : 'Ошибка при сохранении оценки.';
      alert(message);
    }
  };

  const loadScore = (teamId: string) => {
    if (scores[teamId]) {
      setCurrentScore(scores[teamId]);
      setIsEditing(true);
    } else {
      setCurrentScore({ professionalism: 0, technique: 0, completion: 0 });
      setIsEditing(false);
    }
    setSelectedTeam(teamId);
    setHasUnsavedChanges(false);
  };

  const getTeamTotalScore = (teamId: string) => {
    const score = scores[teamId];
    return score ? calculateTotal(score) : 0;
  };

  const getTeamAggregatedScore = (teamId: string) => {
    const teamContestScores = teamScores.filter(score => score.teamId === teamId);
    if (teamContestScores.length === 0) return 0;
    const total = teamContestScores.reduce((sum, score) => sum + score.score, 0);
    return Math.round((total / teamContestScores.length) * 10) / 10;
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
              <h1 className="text-3xl font-bold text-gray-900">Амбулаторный прием</h1>
              <p className="text-gray-600 mt-2">Станция практических навыков (макс. 12 баллов)</p>
              {currentJury && (
                <p className="text-sm text-blue-600 mt-1">Оценивает: {currentJury.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/admin/contest/practical-skills" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
                ← Все станции
              </Link>
              <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                Панель жюри
              </Link>
            </div>
          </div>
        </header>

        {/* Быстрая навигация между станциями */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/admin/contest/practical-skills/sutures" className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            Швы
          </Link>
          <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            Амбулаторный ←
          </span>
          <Link href="/admin/contest/practical-skills/obstetric" className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            Акушерское
          </Link>
          <Link href="/admin/contest/practical-skills/laparoscopy" className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            Лапароскопия
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Форма оценки */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {isEditing ? 'Редактирование оценки' : 'Оценка команды'}
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите команду
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => loadScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите команду...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} (ваша оценка: {getTeamTotalScore(team.id)})
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Профессионализм и подготовка (0-3) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Профессионализм и подготовка (0-3 балла)
                    </label>
                    <select
                      value={currentScore.professionalism}
                      onChange={(e) => {
                        setCurrentScore({...currentScore, professionalism: Number(e.target.value)});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {station?.criteria.find(c => c.id === 'professionalism')?.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Техника и коммуникация (0-5) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Техника и коммуникация (0-5 баллов)
                    </label>
                    <select
                      value={currentScore.technique}
                      onChange={(e) => {
                        setCurrentScore({...currentScore, technique: Number(e.target.value)});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {station?.criteria.find(c => c.id === 'technique')?.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Завершение приема (0-4) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Завершение приема (0-4 балла)
                    </label>
                    <select
                      value={currentScore.completion}
                      onChange={(e) => {
                        setCurrentScore({...currentScore, completion: Number(e.target.value)});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {station?.criteria.find(c => c.id === 'completion')?.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Итоговый балл:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {calculateTotal(currentScore)} / 12
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {hasUnsavedChanges && (
                    <button
                      onClick={() => {
                        loadScore(selectedTeam);
                        setHasUnsavedChanges(false);
                      }}
                      className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 font-semibold"
                    >
                      Отменить
                    </button>
                  )}
                  <button
                    onClick={saveScore}
                    disabled={!hasUnsavedChanges}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold ${
                      hasUnsavedChanges
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isEditing ? 'Обновить оценку' : 'Сохранить оценку'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Таблица результатов */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Текущие результаты</h2>
            
            <div className="space-y-4">
              {teams.map((team) => {
                const myScore = getTeamTotalScore(team.id);
                const aggregatedScore = getTeamAggregatedScore(team.id);
                const score = scores[team.id];
                
                return (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        aggregatedScore >= 10 ? 'bg-green-100 text-green-800' :
                        aggregatedScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        aggregatedScore > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {aggregatedScore} / 12
                      </span>
                    </div>
                    
                    {score ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Профессионализм: {score.professionalism}/3</div>
                        <div>Техника: {score.technique}/5</div>
                        <div>Завершение: {score.completion}/4</div>
                        <div className="font-semibold text-blue-600 pt-2 border-t">
                          Ваша оценка: {myScore}/12
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Не оценено</p>
                    )}
                    
                    <button
                      onClick={() => loadScore(team.id)}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {score ? 'Изменить' : 'Оценить'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Информация о станции</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Гинекологический осмотр пациентки</p>
            <p>• Оценивается профессионализм, техника выполнения и коммуникация с пациенткой</p>
            <p>• Максимальный балл: 12 баллов</p>
          </div>
        </div>
      </div>
    </div>
  );
}
