"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, TeamScore, ClinicalCaseScore } from "@/types";
import { storageUtils } from "@/utils/serverStorage";

export default function ClinicalCaseContestPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentJury, setCurrentJury] = useState<any>(null);
  const [scores, setScores] = useState<{ [key: string]: ClinicalCaseScore }>({});
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<ClinicalCaseScore>({
    correctAnswer: false,
    explanation: 0,
    earlyCompletion: false,
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
        const clinicalCaseScores = contestScores.filter(score => score.contestId === 'clinical-case');
        setTeamScores(clinicalCaseScores);

        // Загружаем оценки текущего члена жюри
        const juryScores = clinicalCaseScores.filter(score => score.juryId === jury.id);
        const juryScoresMap: { [key: string]: ClinicalCaseScore } = {};
        
        juryScores.forEach(score => {
          if (score.details) {
            juryScoresMap[score.teamId] = score.details as ClinicalCaseScore;
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

  const calculateTotal = (score: ClinicalCaseScore) => {
    let total = score.explanation;
    if (score.correctAnswer && score.earlyCompletion) {
      total += 1; // бонус за досрочное выполнение
    }
    // Если ответ неправильный, максимальный балл - 1 (только за объяснение)
    if (!score.correctAnswer && total > 1) {
      total = 1;
    }
    return total;
  };

  const saveScore = async () => {
    if (!selectedTeam || !currentJury) return;

    const teamScore: TeamScore = {
      teamId: selectedTeam,
      contestId: 'clinical-case',
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
      const clinicalCaseScores = updatedScores.filter(score => score.contestId === 'clinical-case');
      setTeamScores(clinicalCaseScores);

      const action = isEditing ? 'обновлена' : 'сохранена';
      alert(`Оценка для команды ${teams.find(t => t.id === selectedTeam)?.name} ${action}!`);
      
      // Сбрасываем форму
      setSelectedTeam("");
      setCurrentScore({
        correctAnswer: false,
        explanation: 0,
        earlyCompletion: false,
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
        explanation: 0,
        earlyCompletion: false,
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

  const handleResetMyScores = async () => {
    if (!currentJury) return;
    const confirmed = window.confirm('Вы уверены, что хотите сбросить ВСЕ ваши оценки по конкурсу "Клинический случай"?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearJuryScores',
          data: { juryId: currentJury.id, contestId: 'clinical-case' },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset scores');
      }

      const updatedScores = await storageUtils.getTeamScores();
      const clinicalCaseScores = updatedScores.filter(score => score.contestId === 'clinical-case');
      setTeamScores(clinicalCaseScores);
      setScores({});
      setSelectedTeam("");
      setCurrentScore({
        correctAnswer: false,
        explanation: 0,
        earlyCompletion: false,
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);

      alert('Все ваши оценки по этому конкурсу были сброшены.');
    } catch (error) {
      console.error('Error resetting scores:', error);
      alert('Ошибка при сбросе оценок. Попробуйте еще раз.');
    }
  };

  const getExplanationText = (value: number) => {
    switch (value) {
      case 3:
        return "Ответ дан правильно, объяснение подробное, последовательное, грамотное, с теоретическими обоснованиями";
      case 2:
        return "Ответ дан правильно, объяснение подробное, но недостаточно логичное, с единичными ошибками в деталях";
      case 1:
        return "Диагноз верный, но объяснение недостаточно полное, непоследовательное, с существенными ошибками";
      case 0:
        return "Диагноз поставлен неправильно, участник не в состоянии объяснить ход решения";
      default:
        return "";
    }
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
              <h1 className="text-3xl font-bold text-gray-900">II конкурс. Клинический случай</h1>
              <p className="text-gray-600 mt-2">Решение ситуационной задачи (макс. 4 балла)</p>
              {currentJury && (
                <p className="text-sm text-blue-600 mt-1">Оценивает: {currentJury.name}</p>
              )}
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
                        Правильность ответа на вопросы задачи
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={currentScore.correctAnswer}
                            onChange={() => {
                              setCurrentScore({...currentScore, correctAnswer: true});
                              setHasUnsavedChanges(true);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">Ответ дан правильно</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={!currentScore.correctAnswer}
                            onChange={() => {
                              setCurrentScore({...currentScore, correctAnswer: false});
                              setHasUnsavedChanges(true);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">Ответ дан неправильно</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Качество объяснения хода решения
                      </label>
                      <select
                        value={currentScore.explanation}
                        onChange={(e) => {
                          setCurrentScore({...currentScore, explanation: Number(e.target.value)});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0 баллов - диагноз неправильный</option>
                        <option value="1">1 балл - диагноз верный, но объяснение неполное</option>
                        <option value="2">2 балла - ответ правильный, но недостаточно логичный</option>
                        <option value="3">3 балла - ответ правильный, объяснение подробное</option>
                      </select>
                      {currentScore.explanation > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          {getExplanationText(currentScore.explanation)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentScore.earlyCompletion}
                          onChange={(e) => {
                            setCurrentScore({...currentScore, earlyCompletion: e.target.checked});
                            setHasUnsavedChanges(true);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Досрочное выполнение (+1 балл)
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Команды, ответившие досрочно (менее 10 минут), получают дополнительный балл
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Итоговый балл:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {calculateTotal(currentScore)} / 4
                    </span>
                  </div>
                  {currentScore.earlyCompletion && (
                    <p className="text-sm text-green-600 mt-2">+1 балл за досрочное выполнение</p>
                  )}
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
                          aggregatedScore >= 3 ? 'bg-green-100 text-green-800' :
                          aggregatedScore >= 2 ? 'bg-yellow-100 text-yellow-800' :
                          aggregatedScore > 0 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {aggregatedScore} / 4
                        </span>
                      </div>
                    </div>
                    
                    {score ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Ответ: {score.correctAnswer ? 'Правильный ✅' : 'Неправильный ❌'}</div>
                        <div>Объяснение: {score.explanation}/3</div>
                        {score.earlyCompletion && (
                          <div className="text-green-600">Досрочное выполнение: +1 балл</div>
                        )}
                        <div className="font-semibold text-blue-600 pt-2 border-t">
                          Ваша оценка: {myScore}/4
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
            <p>• Время на решение: 10 минут</p>
            <p>• Необходимо поставить диагноз, составить план обследования и лечения</p>
            <p>• Назначить основные меры профилактики данной патологии</p>
            <p>• Досрочное выполнение: +1 балл к общему зачету</p>
            <p>• Максимальный балл: 4 балла</p>
            <p>• Оценки нескольких членов жюри усредняются автоматически</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Критерии оценки</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div>
              <strong>3 балла:</strong> ответ дан правильно; объяснение хода решения подробное, последовательное, грамотное, с теоретическими обоснованиями
            </div>
            <div>
              <strong>2 балла:</strong> ответ дан правильно, объяснение хода решения подробное, но недостаточно логичное, с единичными ошибками в деталях, испытывает затруднения в теоретическом обосновании
            </div>
            <div>
              <strong>1 балл:</strong> диагноз в задаче поставлен верно, но объяснение хода решения недостаточно полное, непоследовательное, с существенными ошибками, слабым теоретическим обоснованием
            </div>
            <div>
              <strong>0 баллов:</strong> диагноз в задаче поставлен неправильно, участник не в состоянии объяснить ход решения
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}