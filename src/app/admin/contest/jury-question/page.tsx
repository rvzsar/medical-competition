"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, JuryQuestionScore, JuryMember } from "@/types";
import { storageUtils } from "@/utils/storage";

export default function JuryQuestionContestPage() {
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
  const [currentScore, setCurrentScore] = useState<JuryQuestionScore>({
    correctAnswer: false,
    points: 0,
  });

  const saveScore = () => {
    if (selectedTeam && currentJury) {
      const teamScore = {
        teamId: selectedTeam,
        contestId: "jury-question",
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

  const loadScore = (teamId: string) => {
    const allScores = storageUtils.getTeamScores();
    const existingScore = allScores.find(s =>
      s.teamId === teamId && s.contestId === "jury-question" && s.juryId === currentJury?.id
    );
    
    if (existingScore && existingScore.details) {
      setCurrentScore(existingScore.details as JuryQuestionScore);
    } else {
      setCurrentScore({
        correctAnswer: false,
        points: 0,
      });
    }
    setSelectedTeam(teamId);
  };

  const getTeamTotalScore = (teamId: string) => {
    return storageUtils.getAggregatedScore(teamId, "jury-question");
  };

  const getTeamScores = (teamId: string) => {
    const allScores = storageUtils.getTeamScores();
    return allScores.filter(s => s.teamId === teamId && s.contestId === "jury-question");
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
              <h1 className="text-3xl font-bold text-gray-900">VI конкурс. Вопрос от жюри</h1>
              <div className="mt-2">
                <p className="text-gray-600">Дополнительные вопросы для команд, претендующих на призовые места (макс. 2 балла)</p>
                <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded">
                  <p className="text-sm text-orange-800 font-medium">⚠️ Этот конкурс проводится только при необходимости</p>
                  <p className="text-xs text-orange-700 mt-1">Используется при возникновении спорной ситуации при выборе призовых мест</p>
                </div>
                <p className="text-sm text-blue-600 mt-2">Оценивает: {currentJury.name}</p>
              </div>
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
                    
                    <button
                      onClick={() => loadScore(team.id)}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {teamScores.length > 0 ? 'Изменить оценку' : 'Оценить команду'}
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
            <p>• Проводится при возникновении спорной ситуации при выборе призового места</p>
            <p>• Член жюри задает вопрос командам</p>
            <p>• Участвуют команды с наибольшим количеством баллов, претендующие на призовые места</p>
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

        <div className="mt-6 bg-red-50 rounded-lg p-6">
          <h3 className="font-semibold text-red-800 mb-2">Важно!</h3>
          <div className="text-sm text-red-700">
            <p>Этот конкурс используется только в случае необходимости разрешения спорных ситуаций при определении призовых мест.</p>
          </div>
        </div>
      </div>
    </div>
  );
}