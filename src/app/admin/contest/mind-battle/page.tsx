"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, MindBattleScore, JuryMember } from "@/types";
import { storageUtils } from "@/utils/storage";

export default function MindBattleContestPage() {
  const router = useRouter();
  const [currentJury, setCurrentJury] = useState<JuryMember | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    // Проверяем авторизацию
    const jury = storageUtils.getCurrentJury();
    if (!jury) {
      router.push('/login');
      return;
    }
    setCurrentJury(jury);

    // Загружаем команды
    const savedTeams = storageUtils.getTeams();
    setTeams(savedTeams);
  }, [router]);

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<MindBattleScore>({
    correctAnswer: false,
    points: 0,
  });

  const saveScore = () => {
    if (selectedTeam && currentJury) {
      const teamScore = {
        teamId: selectedTeam,
        contestId: "mind-battle",
        juryId: currentJury.id,
        score: currentScore.points,
        details: currentScore,
        completedAt: new Date()
      };
      
      storageUtils.addTeamScore(teamScore);
      
      setSelectedTeam("");
      setCurrentScore({
        correctAnswer: false,
        points: 0,
      });
    }
  };

  const getTeamTotalScore = (teamId: string) => {
    return storageUtils.getAggregatedScore(teamId, "mind-battle");
  };

  const getTeamScores = (teamId: string) => {
    const allScores = storageUtils.getTeamScores();
    return allScores.filter(s => s.teamId === teamId && s.contestId === "mind-battle");
  };

  if (!currentJury) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
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
            <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Назад к панели жюри
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Форма оценки */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Оценка ответа команды</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите команду
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
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

                <button
                  onClick={saveScore}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
                  disabled={!selectedTeam}
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
                const teamScores = getTeamScores(team.id);
                
                return (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        totalScore >= 2 ? 'bg-green-100 text-green-800' :
                        totalScore >= 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {totalScore} / 2
                      </span>
                    </div>
                    
                    {teamScores.length > 0 ? (
                      <div className="space-y-2">
                        {teamScores.map((score, index) => (
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

        <div className="mt-6 bg-orange-50 rounded-lg p-6">
          <h3 className="font-semibold text-orange-800 mb-2">Специальный приз</h3>
          <div className="text-sm text-orange-700">
            <p>Команда, задавшая самый креативный вопрос, получает специальный приз жюри олимпиады.</p>
          </div>
        </div>
      </div>
    </div>
  );
}