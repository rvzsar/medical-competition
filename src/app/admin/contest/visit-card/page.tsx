"use client";

import { useState } from "react";
import Link from "next/link";
import { Team, VisitCardScore } from "@/types";

export default function VisitCardContestPage() {
  const [teams] = useState<Team[]>([
    { id: "1", name: "Команда А", members: ["Иванов", "Петров", "Сидоров"], totalScore: 0 },
    { id: "2", name: "Команда Б", members: ["Козлов", "Николаев", "Михайлов"], totalScore: 0 },
    { id: "3", name: "Команда В", members: ["Александров", "Дмитриев", "Федоров"], totalScore: 0 },
  ]);

  const [scores, setScores] = useState<{ [key: string]: VisitCardScore }>({});

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentScore, setCurrentScore] = useState<VisitCardScore>({
    integrity: 0,
    culture: 0,
    creativity: 0,
    originality: 0,
    timePenalty: 0,
  });

  const calculateTotal = (score: VisitCardScore) => {
    return score.integrity + score.culture + score.creativity + score.originality - (score.timePenalty || 0);
  };

  const saveScore = () => {
    if (selectedTeam) {
      setScores({
        ...scores,
        [selectedTeam]: { ...currentScore },
      });
      setSelectedTeam("");
      setCurrentScore({
        integrity: 0,
        culture: 0,
        creativity: 0,
        originality: 0,
        timePenalty: 0,
      });
    }
  };

  const loadScore = (teamId: string) => {
    if (scores[teamId]) {
      setCurrentScore(scores[teamId]);
    } else {
      setCurrentScore({
        integrity: 0,
        culture: 0,
        creativity: 0,
        originality: 0,
        timePenalty: 0,
      });
    }
    setSelectedTeam(teamId);
  };

  const getTeamTotalScore = (teamId: string) => {
    const score = scores[teamId];
    return score ? calculateTotal(score) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">I конкурс. Визитка</h1>
              <p className="text-gray-600 mt-2">Оценка командной презентации (макс. 6 баллов)</p>
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
                        Целостность выступления (2 балла)
                      </label>
                      <select
                        value={currentScore.integrity}
                        onChange={(e) => setCurrentScore({...currentScore, integrity: Number(e.target.value)})}
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
                        onChange={(e) => setCurrentScore({...currentScore, culture: Number(e.target.value)})}
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
                        onChange={(e) => setCurrentScore({...currentScore, creativity: Number(e.target.value)})}
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
                        onChange={(e) => setCurrentScore({...currentScore, originality: Number(e.target.value)})}
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
                        onChange={(e) => setCurrentScore({...currentScore, timePenalty: Number(e.target.value)})}
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
                        totalScore >= 5 ? 'bg-green-100 text-green-800' :
                        totalScore >= 3 ? 'bg-yellow-100 text-yellow-800' :
                        totalScore > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {totalScore} / 6
                      </span>
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
            <p>• Продолжительность выступления: не более 3 минут</p>
            <p>• Формат: устная презентация и/или видеоролик</p>
            <p>• Штраф: 1 балл за каждую лишнюю минуту</p>
          </div>
        </div>
      </div>
    </div>
  );
}