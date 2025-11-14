"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, MindBattleScore, JuryMember, TeamScore } from "@/types";
import { storageUtils } from "@/utils/serverStorage";

export default function MindBattleContestPage() {
  const router = useRouter();
  const [currentJury, setCurrentJury] = useState<JuryMember | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: MindBattleScore }>({});

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
        const mindBattleScores = contestScores.filter(score => score.contestId === 'mind-battle');
        setTeamScores(mindBattleScores);

        // Загружаем оценки текущего члена жюри
        const juryScores = mindBattleScores.filter(score => score.juryId === jury.id);
        const juryScoresMap: { [key: string]: MindBattleScore } = {};
        
        juryScores.forEach(score => {
          if (score.details) {
            juryScoresMap[score.teamId] = score.details as MindBattleScore;
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

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<MindBattleScore>({
    correctAnswer: false,
    points: 0,
  });

  const saveScore = async () => {
    if (!selectedTeam || !currentJury) return;

    const teamScore: TeamScore = {
      teamId: selectedTeam,
      contestId: "mind-battle",
      juryId: currentJury.id,
      score: currentScore.points,
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
      const mindBattleScores = updatedScores.filter(score => score.contestId === 'mind-battle');
      setTeamScores(mindBattleScores);
      
      const action = isEditing ? 'обновлена' : 'сохранена';
      alert(`Оценка для команды ${teams.find(t => t.id === selectedTeam)?.name} ${action}!`);
      
      setSelectedTeam("");
      setCurrentScore({
        correctAnswer: false,
        points: 0,
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
        correctAnswer: false,
        points: 0,
      });
      setIsEditing(false);
    }
    setSelectedTeam(teamId);
    setHasUnsavedChanges(false);
  };

  const getTeamTotalScore = (teamId: string) => {
    const score = scores[teamId];
    return score ? score.points : 0;
  };

  const getTeamAggregatedScore = (teamId: string) => {
    const teamContestScores = teamScores.filter(score => score.teamId === teamId);
    if (teamContestScores.length === 0) return 0;
    
    const total = teamContestScores.reduce((sum, score) => sum + score.score, 0);
    return Math.round((total / teamContestScores.length) * 10) / 10;
  };

  const getTeamScores = (teamId: string) => {
    return teamScores.filter(s => s.teamId === teamId && s.contestId === "mind-battle");
  };

  const getJuryCount = (teamId: string) => {
    return teamScores.filter(score => score.teamId === teamId).length;
  };

  const handleResetMyScores = async () => {
    if (!currentJury) return;
    const confirmed = window.confirm('Вы уверены, что хотите сбросить ВСЕ ваши оценки по конкурсу "Битва умов"?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearJuryScores',
          data: { juryId: currentJury.id, contestId: 'mind-battle' },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset scores');
      }

      const updatedScores = await storageUtils.getTeamScores();
      const mindBattleScores = updatedScores.filter(score => score.contestId === 'mind-battle');
      setTeamScores(mindBattleScores);
      setScores({});
      setSelectedTeam("");
      setCurrentScore({
        correctAnswer: false,
        points: 0,
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);

      alert('Все ваши оценки по этому конкурсу были сброшены.');
    } catch (error) {
      console.error('Error resetting scores:', error);
      alert('Ошибка при сбросе оценок. Попробуйте еще раз.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Загрузка данных...</div>
      </div>
    );
  }

  if (!currentJury) {
    return <div className="flex justify-center items-center min-h-screen">Ошибка авторизации</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IV конкурс. Битва умов</h1>
              <p className="text-gray-600 mt-2">Вопросы командам-соперникам (макс. 2 балла)</p>
              <p className="text-sm text-blue-600 mt-1">Оценивает: {currentJury.name}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleResetMyScores}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
              >
                🔄 Сбросить мои оценки
              </button>
              <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                Назад к панели жюри
              </Link>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Форма оценки */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {isEditing ? 'Редактирование оценки' : 'Оценка ответа команды'}
              {isEditing && (
                <span className="ml-2 text-sm text-blue-600 font-medium">(режим редактирования)</span>
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
                    {team.name} (ваша оценка: {getTeamTotalScore(team.id)}/2, средний: {getTeamAggregatedScore(team.id)})
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Вопрос и ответ:</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Оценка ответа команды
                      </label>
                      <select
                        value={currentScore.points}
                        onChange={(e) => {
                          const points = Number(e.target.value);
                          setCurrentScore({
                            correctAnswer: points > 0,
                            points,
                          });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0 баллов - ответ неверный</option>
                        <option value="1">1 балл - в ответе допущены неточности</option>
                        <option value="2">2 балла - дан верный, полный ответ</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Балл за ответ:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {currentScore.points} / 2
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
                const aggregatedScore = getTeamAggregatedScore(team.id);
                const teamContestScores = getTeamScores(team.id);
                const juryCount = getJuryCount(team.id);
                
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
                          aggregatedScore >= 2 ? 'bg-green-100 text-green-800' :
                          aggregatedScore >= 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {aggregatedScore} / 2
                        </span>
                      </div>
                    </div>
                    
                    {teamContestScores.length > 0 ? (
                      <div className="space-y-2">
                        {teamContestScores.map((score, index) => (
                          <div key={index} className="text-sm text-gray-600 border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-center">
                              <span>Оценка от жюри</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                score.score === 2 ? 'bg-green-100 text-green-800' :
                                score.score === 1 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {score.score} балл{score.score !== 1 ? 'а' : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Еще не оценено</p>
                    )}
                    
                    <button
                      onClick={() => loadScore(team.id)}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {scores[team.id] ? 'Изменить оценку' : 'Оценить команду'}
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
            <p>• Каждая команда задает 1 вопрос одной команде соперника</p>
            <p>• Команда-соперник выбирается путем жеребьевки</p>
            <p>• Тематика вопросов: латинские термины, акушерство и гинекология в искусстве и литературе, ученые</p>
            <p>• Участвуют все команды</p>
            <p>• Максимальный балл: 2 балла</p>
            <p>• Оценки нескольких членов жюри усредняются автоматически</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Критерии оценки</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div>
              <strong>2 балла:</strong> дан верный, полный ответ
            </div>
            <div>
              <strong>1 балл:</strong> в ответе допущены неточности
            </div>
            <div>
              <strong>0 баллов:</strong> ответ неверный
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}