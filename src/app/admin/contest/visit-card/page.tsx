"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, TeamScore, VisitCardScore } from "@/types";
import { storageUtils } from "@/utils/serverStorage";

export default function VisitCardContestPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentJury, setCurrentJury] = useState<any>(null);
  const [scores, setScores] = useState<{ [key: string]: VisitCardScore }>({});
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<VisitCardScore>({
    integrity: 0,
    culture: 0,
    creativity: 0,
    originality: 0,
    timePenalty: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Проверяем авторизацию
      const jury = storageUtils.getCurrentJury();
      if (!jury) {
        router.push('/login');
        return;
      }
      setCurrentJury(jury);

      try {
        // Загружаем команды с сервера
        const savedTeams = await storageUtils.getTeams();
        setTeams(savedTeams);

        // Загружаем оценки для этого конкурса
        const contestScores = await storageUtils.getTeamScores();
        const visitCardScores = contestScores.filter(score => score.contestId === 'visit-card');
        setTeamScores(visitCardScores);

        // Загружаем оценки текущего члена жюри
        const juryScores = visitCardScores.filter(score => score.juryId === jury.id);
        const juryScoresMap: { [key: string]: VisitCardScore } = {};
        
        juryScores.forEach(score => {
          if (score.details) {
            juryScoresMap[score.teamId] = score.details as VisitCardScore;
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

  const calculateTotal = (score: VisitCardScore) => {
    return score.integrity + score.culture + score.creativity + score.originality - (score.timePenalty || 0);
  };

  const saveScore = async () => {
    if (!selectedTeam || !currentJury) return;

    const teamScore: TeamScore = {
      teamId: selectedTeam,
      contestId: 'visit-card',
      juryId: currentJury.id,
      score: calculateTotal(currentScore),
      details: currentScore,
      completedAt: new Date()
    };

    try {
      await storageUtils.addTeamScore(teamScore);
      
      // Обновляем локальное состояние
      setScores({
        ...scores,
        [selectedTeam]: { ...currentScore },
      });

      // Обновляем список оценок
      const updatedScores = await storageUtils.getTeamScores();
      const visitCardScores = updatedScores.filter(score => score.contestId === 'visit-card');
      setTeamScores(visitCardScores);

      const action = isEditing ? 'обновлена' : 'сохранена';
      alert(`Оценка для команды ${teams.find(t => t.id === selectedTeam)?.name} ${action}!`);
      
      // Сбрасываем форму
      setSelectedTeam("");
      setCurrentScore({
        integrity: 0,
        culture: 0,
        creativity: 0,
        originality: 0,
        timePenalty: 0,
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Ошибка при сохранении оценки. Попробуйте еще раз.');
    }
  };

  const loadScore = (teamId: string) => {
    if (scores[teamId]) {
      setCurrentScore(scores[teamId]);
      setIsEditing(true);
    } else {
      setCurrentScore({
        integrity: 0,
        culture: 0,
        creativity: 0,
        originality: 0,
        timePenalty: 0,
      });
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

  const getJuryCount = (teamId: string) => {
    return teamScores.filter(score => score.teamId === teamId).length;
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
              <h1 className="text-3xl font-bold text-gray-900">I конкурс. Визитка</h1>
              <p className="text-gray-600 mt-2">Оценка командной презентации (макс. 6 баллов)</p>
              {currentJury && (
                <p className="text-sm text-blue-600 mt-1">Оценивает: {currentJury.name}</p>
              )}
            </div>
            <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Назад к панели жюри
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Форма оценки */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {isEditing ? 'Редактирование оценки' : 'Оценка команды'}
              {isEditing && (
                <span className="ml-2 text-sm text-blue-600 font-normal">(режим редактирования)</span>
              )}
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите команду
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  loadScore(e.target.value);
                }}
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
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Критерии оценки:</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Целостность выступления (2 балла)
                      </label>
                      <select
                        value={currentScore.integrity}
                        onChange={(e) => {
                          setCurrentScore({...currentScore, integrity: Number(e.target.value)});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0 баллов</option>
                        <option value="1">1 балл</option>
                        <option value="2">2 балла</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Культура выступления, сплоченность команды (1 балл)
                      </label>
                      <select
                        value={currentScore.culture}
                        onChange={(e) => {
                          setCurrentScore({...currentScore, culture: Number(e.target.value)});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0 баллов</option>
                        <option value="1">1 балл</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Творческие способности, артистизм (2 балла)
                      </label>
                      <select
                        value={currentScore.creativity}
                        onChange={(e) => {
                          setCurrentScore({...currentScore, creativity: Number(e.target.value)});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0 баллов</option>
                        <option value="1">1 балл</option>
                        <option value="2">2 балла</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Оригинальность выступления (1 балл)
                      </label>
                      <select
                        value={currentScore.originality}
                        onChange={(e) => {
                          setCurrentScore({...currentScore, originality: Number(e.target.value)});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0 баллов</option>
                        <option value="1">1 балл</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Штраф за превышение времени (1 балл за каждую лишнюю минуту)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentScore.timePenalty || 0}
                        onChange={(e) => {
                          setCurrentScore({...currentScore, timePenalty: Number(e.target.value)});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Итоговый балл:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {calculateTotal(currentScore)} / 6
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
                      Отменить изменения
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
                {hasUnsavedChanges && (
                  <p className="text-sm text-orange-600 text-center mt-2">
                    ⚠️ Есть несохраненные изменения
                  </p>
                )}
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
                const juryCount = getJuryCount(team.id);
                const score = scores[team.id];
                
                return (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <div className="flex items-center gap-2">
                        {juryCount > 1 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {juryCount} оценки
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          aggregatedScore >= 5 ? 'bg-green-100 text-green-800' :
                          aggregatedScore >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          aggregatedScore > 0 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {aggregatedScore} / 6
                        </span>
                      </div>
                    </div>
                    
                    {score ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Целостность: {score.integrity}/2</div>
                        <div>Культура: {score.culture}/1</div>
                        <div>Творчество: {score.creativity}/2</div>
                        <div>Оригинальность: {score.originality}/1</div>
                        {(score.timePenalty && score.timePenalty > 0) && (
                          <div className="text-red-600">Штраф: -{score.timePenalty}</div>
                        )}
                        <div className="font-semibold text-blue-600 pt-2 border-t">
                          Ваша оценка: {myScore}/6
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Вы еще не оценили эту команду</p>
                    )}
                    
                    <button
                      onClick={() => loadScore(team.id)}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {score ? 'Изменить оценку' : 'Оценить команду'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Информация о конкурсе</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Продолжительность выступления: не более 3 минут</p>
            <p>• Формат: устная презентация и/или видеоролик</p>
            <p>• Штраф: 1 балл за каждую лишнюю минуту</p>
            <p>• Максимальный балл: 6 баллов</p>
            <p>• Оценки нескольких членов жюри усредняются автоматически</p>
          </div>
        </div>
      </div>
    </div>
  );
}