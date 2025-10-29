"use client";

import { useState } from "react";
import Link from "next/link";
import { Team, ClinicalCaseScore } from "@/types";

export default function ClinicalCaseContestPage() {
  const [teams] = useState<Team[]>([
    { id: "1", name: "Команда А", members: ["Иванов", "Петров", "Сидоров"], totalScore: 0 },
    { id: "2", name: "Команда Б", members: ["Козлов", "Николаев", "Михайлов"], totalScore: 0 },
    { id: "3", name: "Команда В", members: ["Александров", "Дмитриев", "Федоров"], totalScore: 0 },
  ]);

  const [scores, setScores] = useState<{ [key: string]: ClinicalCaseScore }>({});

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<ClinicalCaseScore>({
    correctAnswer: false,
    explanation: 0,
    earlyCompletion: false,
  });

  const calculateTotal = (score: ClinicalCaseScore) => {
    let total = score.explanation;
    if (score.correctAnswer && score.earlyCompletion) {
      total += 1; // бонус за досрочное выполнение
    }
    return total;
  };

  const saveScore = () => {
    if (selectedTeam) {
      setScores({
        ...scores,
        [selectedTeam]: { ...currentScore },
      });
      setSelectedTeam("");
      setCurrentScore({
        correctAnswer: false,
        explanation: 0,
        earlyCompletion: false,
      });
    }
  };

  const loadScore = (teamId: string) => {
    if (scores[teamId]) {
      setCurrentScore(scores[teamId]);
    } else {
      setCurrentScore({
        correctAnswer: false,
        explanation: 0,
        earlyCompletion: false,
      });
    }
    setSelectedTeam(teamId);
  };

  const getTeamTotalScore = (teamId: string) => {
    const score = scores[teamId];
    return score ? calculateTotal(score) : 0;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">II конкурс. Клинический случай</h1>
              <p className="text-gray-600 mt-2">Решение ситуационной задачи (макс. 4 балла)</p>
            </div>
            <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Назад к панели жюри
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Форма оценки */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Оценка команды</h2>
            
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
                    {team.name} (текущий балл: {getTeamTotalScore(team.id)})
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
                            onChange={() => setCurrentScore({...currentScore, correctAnswer: true})}
                            className="mr-2"
                          />
                          <span className="text-sm">Ответ дан правильно</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={!currentScore.correctAnswer}
                            onChange={() => setCurrentScore({...currentScore, correctAnswer: false})}
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
                        onChange={(e) => setCurrentScore({...currentScore, explanation: Number(e.target.value)})}
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
                          onChange={(e) => setCurrentScore({...currentScore, earlyCompletion: e.target.checked})}
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

                <button
                  onClick={saveScore}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  Сохранить оценку
                </button>
              </div>
            )}
          </div>

          {/* Таблица результатов */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Текущие результаты</h2>
            
            <div className="space-y-4">
              {teams.map((team) => {
                const totalScore = getTeamTotalScore(team.id);
                const score = scores[team.id];
                
                return (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        totalScore >= 3 ? 'bg-green-100 text-green-800' :
                        totalScore >= 2 ? 'bg-yellow-100 text-yellow-800' :
                        totalScore > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {totalScore} / 4
                      </span>
                    </div>
                    
                    {score ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Ответ: {score.correctAnswer ? 'Правильный ✅' : 'Неправильный ❌'}</div>
                        <div>Объяснение: {score.explanation}/3</div>
                        {score.earlyCompletion && (
                          <div className="text-green-600">Досрочное выполнение: +1 балл</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Еще не оценено</p>
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