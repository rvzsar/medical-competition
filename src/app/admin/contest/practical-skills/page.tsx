"use client";

import { useState } from "react";
import Link from "next/link";
import { Team, PracticalSkillsScore, SuturesScore, AmbulatoryReceptionScore, ObstetricAidScore, LaparoscopyScore } from "@/types";

export default function PracticalSkillsContestPage() {
  const [teams] = useState<Team[]>([
    { id: "1", name: "Команда А", members: ["Иванов", "Петров", "Сидоров"], totalScore: 0 },
    { id: "2", name: "Команда Б", members: ["Козлов", "Николаев", "Михайлов"], totalScore: 0 },
    { id: "3", name: "Команда В", members: ["Александров", "Дмитриев", "Федоров"], totalScore: 0 },
  ]);

  const [scores, setScores] = useState<{ [key: string]: PracticalSkillsScore }>({});

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("sutures");
  const [currentScore, setCurrentScore] = useState<PracticalSkillsScore>({
    sutures: {
      aesthetics: 0,
      adaptation: 0,
      technique: 0,
      time: 0,
    },
    ambulatoryReception: {
      preparation: 0,
      technique: 0,
      completion: 0,
    },
    obstetricAid: {
      correctness: 0,
      safety: 0,
      time: 0,
      teamwork: 0,
    },
    laparoscopy: {
      translocation: { accuracy: 0, trajectory: 0 },
      coordination: { accuracy: 0, trajectory: 0 },
      targeting: { accuracy: 0, trajectory: 0 },
      parking: { accuracy: 0, trajectory: 0 },
    },
  });

  const calculateSuturesTotal = (sutures: SuturesScore) => {
    return sutures.aesthetics + sutures.adaptation + sutures.technique + sutures.time;
  };

  const calculateAmbulatoryTotal = (ambulatory: AmbulatoryReceptionScore) => {
    return ambulatory.preparation + ambulatory.technique + ambulatory.completion;
  };

  const calculateObstetricTotal = (obstetric: ObstetricAidScore) => {
    return obstetric.correctness + obstetric.safety + obstetric.time + obstetric.teamwork;
  };

  const calculateLaparoscopyTotal = (laparoscopy: LaparoscopyScore) => {
    return (
      laparoscopy.translocation.accuracy + laparoscopy.translocation.trajectory +
      laparoscopy.coordination.accuracy + laparoscopy.coordination.trajectory +
      laparoscopy.targeting.accuracy + laparoscopy.targeting.trajectory +
      laparoscopy.parking.accuracy + laparoscopy.parking.trajectory
    );
  };

  const calculateTotalScore = (score: PracticalSkillsScore) => {
    return (
      calculateSuturesTotal(score.sutures) +
      calculateAmbulatoryTotal(score.ambulatoryReception) +
      calculateObstetricTotal(score.obstetricAid) +
      calculateLaparoscopyTotal(score.laparoscopy)
    );
  };

  const saveScore = () => {
    if (selectedTeam) {
      setScores({
        ...scores,
        [selectedTeam]: { ...currentScore },
      });
      setSelectedTeam("");
      setSelectedStation("sutures");
      setCurrentScore({
        sutures: {
          aesthetics: 0,
          adaptation: 0,
          technique: 0,
          time: 0,
        },
        ambulatoryReception: {
          preparation: 0,
          technique: 0,
          completion: 0,
        },
        obstetricAid: {
          correctness: 0,
          safety: 0,
          time: 0,
          teamwork: 0,
        },
        laparoscopy: {
          translocation: { accuracy: 0, trajectory: 0 },
          coordination: { accuracy: 0, trajectory: 0 },
          targeting: { accuracy: 0, trajectory: 0 },
          parking: { accuracy: 0, trajectory: 0 },
        },
      });
    }
  };

  const loadScore = (teamId: string) => {
    if (scores[teamId]) {
      setCurrentScore(scores[teamId]);
    } else {
      setCurrentScore({
        sutures: {
          aesthetics: 0,
          adaptation: 0,
          technique: 0,
          time: 0,
        },
        ambulatoryReception: {
          preparation: 0,
          technique: 0,
          completion: 0,
        },
        obstetricAid: {
          correctness: 0,
          safety: 0,
          time: 0,
          teamwork: 0,
        },
        laparoscopy: {
          translocation: { accuracy: 0, trajectory: 0 },
          coordination: { accuracy: 0, trajectory: 0 },
          targeting: { accuracy: 0, trajectory: 0 },
          parking: { accuracy: 0, trajectory: 0 },
        },
      });
    }
    setSelectedTeam(teamId);
    setSelectedStation("sutures");
  };

  const getTeamTotalScore = (teamId: string) => {
    const score = scores[teamId];
    return score ? calculateTotalScore(score) : 0;
  };

  const stations = [
    { id: "sutures", name: "Швы при кесаревом сечении", maxScore: 12 },
    { id: "ambulatory", name: "Амбулаторный прием", maxScore: 12 },
    { id: "obstetric", name: "Акушерское пособие в родах", maxScore: 12 },
    { id: "laparoscopy", name: "Лапароскопический симулятор", maxScore: 12 },
  ];

  const renderSuturesForm = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-700">Швы при кесаревом сечении (до 10 минут)</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Эстетичность (3, 1, 0 баллов)
        </label>
        <select
          value={currentScore.sutures.aesthetics}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            sutures: { ...currentScore.sutures, aesthetics: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - деформации, неравномерность</option>
          <option value="1">1 - незначительные недостатки</option>
          <option value="3">3 - равномерные промежутки, отсутствие деформаций</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Адаптация краев раны (4, 2, 1, 0 баллов)
        </label>
        <select
          value={currentScore.sutures.adaptation}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            sutures: { ...currentScore.sutures, adaptation: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - критерий не выполнен</option>
          <option value="1">1 - адаптация только в 1 виде шва</option>
          <option value="2">2 - адаптация в 2 видах шва</option>
          <option value="4">4 - полная адаптация во всех 3 видах шва</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Правильная работа с инструментами (3, 1, 0 баллов)
        </label>
        <select
          value={currentScore.sutures.technique}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            sutures: { ...currentScore.sutures, technique: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - грубые нарушения безопасности</option>
          <option value="1">1 - потенциально опасные манипуляции</option>
          <option value="3">3 - полное соблюдение принципов безопасности</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Время выполнения (2, 1, 0 баллов)
        </label>
        <select
          value={currentScore.sutures.time}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            sutures: { ...currentScore.sutures, time: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - более 10 минут</option>
          <option value="1">1 - 10 минут</option>
          <option value="2">2 - до 7 минут</option>
        </select>
      </div>

      <div className="bg-blue-50 p-3 rounded">
        <p className="text-sm font-semibold text-blue-800">
          Баллы за станцию: {calculateSuturesTotal(currentScore.sutures)} / 12
        </p>
      </div>
    </div>
  );

  const renderAmbulatoryForm = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-700">Амбулаторный прием (10 минут)</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Профессионализм и подготовка (макс. 3 балла)
        </label>
        <select
          value={currentScore.ambulatoryReception.preparation}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            ambulatoryReception: { ...currentScore.ambulatoryReception, preparation: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 баллов</option>
          <option value="1">1 балл</option>
          <option value="2">2 балла</option>
          <option value="3">3 балла</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Техника выполнения и коммуникация (макс. 5 баллов)
        </label>
        <select
          value={currentScore.ambulatoryReception.technique}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            ambulatoryReception: { ...currentScore.ambulatoryReception, technique: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 баллов</option>
          <option value="1">1 балл</option>
          <option value="2">2 балла</option>
          <option value="3">3 балла</option>
          <option value="4">4 балла</option>
          <option value="5">5 баллов</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Завершение приема и информирование (макс. 4 балла)
        </label>
        <select
          value={currentScore.ambulatoryReception.completion}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            ambulatoryReception: { ...currentScore.ambulatoryReception, completion: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 баллов</option>
          <option value="1">1 балл</option>
          <option value="2">2 балла</option>
          <option value="3">3 балла</option>
          <option value="4">4 балла</option>
        </select>
      </div>

      <div className="bg-blue-50 p-3 rounded">
        <p className="text-sm font-semibold text-blue-800">
          Баллы за станцию: {calculateAmbulatoryTotal(currentScore.ambulatoryReception)} / 12
        </p>
      </div>
    </div>
  );

  const renderObstetricForm = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-700">Акушерское пособие в родах (до 5 минут)</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Правильно выполненные моменты (5, 3, 1, 0 баллов)
        </label>
        <select
          value={currentScore.obstetricAid.correctness}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            obstetricAid: { ...currentScore.obstetricAid, correctness: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - 3+ ошибок, нарушена последовательность</option>
          <option value="1">1 - 2 ошибки, ошибка в последовательности</option>
          <option value="3">3 - 1 ошибка, правильная последовательность</option>
          <option value="5">5 - все моменты выполнены правильно</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Безопасность при манипуляции (3, 1, 0 баллов)
        </label>
        <select
          value={currentScore.obstetricAid.safety}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            obstetricAid: { ...currentScore.obstetricAid, safety: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - грубые нарушения безопасности</option>
          <option value="1">1 - потенциально опасные манипуляции</option>
          <option value="3">3 - полное соблюдение принципов безопасности</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Время выполнения (2, 1, 0 баллов)
        </label>
        <select
          value={currentScore.obstetricAid.time}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            obstetricAid: { ...currentScore.obstetricAid, time: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - более 5 минут</option>
          <option value="1">1 - 5 минут</option>
          <option value="2">2 - 3 минуты</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Слаженность работы бригады (2, 1, 0 баллов)
        </label>
        <select
          value={currentScore.obstetricAid.teamwork}
          onChange={(e) => setCurrentScore({
            ...currentScore,
            obstetricAid: { ...currentScore.obstetricAid, teamwork: Number(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">0 - грубые нарушения при работе</option>
          <option value="1">1 - нескоординированное взаимодействие</option>
          <option value="2">2 - соблюдение критерия</option>
        </select>
      </div>

      <div className="bg-blue-50 p-3 rounded">
        <p className="text-sm font-semibold text-blue-800">
          Баллы за станцию: {calculateObstetricTotal(currentScore.obstetricAid)} / 12
        </p>
      </div>
    </div>
  );

  const renderLaparoscopyForm = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-700">Лапароскопический виртуальный симулятор (до 10 минут)</h4>
      
      {[
        { key: 'translocation', name: 'Транслокация предметов' },
        { key: 'coordination', name: 'Координация с двумя инструментами' },
        { key: 'targeting', name: 'Наведение на цель' },
        { key: 'parking', name: 'Парковка инструмента' }
      ].map((exercise) => (
        <div key={exercise.key} className="border border-gray-200 rounded p-3">
          <h5 className="font-medium text-gray-700 mb-2">{exercise.name}</h5>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Точность (2, 1, 0 баллов)
              </label>
              <select
                value={currentScore.laparoscopy[exercise.key as keyof typeof currentScore.laparoscopy].accuracy}
                onChange={(e) => setCurrentScore({
                  ...currentScore,
                  laparoscopy: {
                    ...currentScore.laparoscopy,
                    [exercise.key]: {
                      ...currentScore.laparoscopy[exercise.key as keyof typeof currentScore.laparoscopy],
                      accuracy: Number(e.target.value)
                    }
                  }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Траектория (2, 1, 0 баллов)
              </label>
              <select
                value={currentScore.laparoscopy[exercise.key as keyof typeof currentScore.laparoscopy].trajectory}
                onChange={(e) => setCurrentScore({
                  ...currentScore,
                  laparoscopy: {
                    ...currentScore.laparoscopy,
                    [exercise.key]: {
                      ...currentScore.laparoscopy[exercise.key as keyof typeof currentScore.laparoscopy],
                      trajectory: Number(e.target.value)
                    }
                  }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-blue-50 p-3 rounded">
        <p className="text-sm font-semibold text-blue-800">
          Баллы за станцию: {calculateLaparoscopyTotal(currentScore.laparoscopy)} / 12
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">III конкурс. Практические навыки</h1>
              <p className="text-gray-600 mt-2">Оценка практических навыков на 4 станциях (макс. 48 баллов)</p>
            </div>
            <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Назад к панели жюри
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Выбор команды и станции */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Выбор команды</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Команда
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
                    {team.name} ({getTeamTotalScore(team.id)}/48)
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Станция
                </label>
                <div className="space-y-2">
                  {stations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => setSelectedStation(station.id)}
                      className={`w-full text-left px-3 py-2 rounded-md border ${
                        selectedStation === station.id
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{station.name}</div>
                      <div className="text-xs text-gray-500">макс. {station.maxScore} баллов</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Форма оценки */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Оценка станции</h2>
            
            {selectedTeam ? (
              <div className="space-y-6">
                {selectedStation === 'sutures' && renderSuturesForm()}
                {selectedStation === 'ambulatory' && renderAmbulatoryForm()}
                {selectedStation === 'obstetric' && renderObstetricForm()}
                {selectedStation === 'laparoscopy' && renderLaparoscopyForm()}

                <div className="border-t pt-6">
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">Общий балл за все станции:</span>
                      <span className="text-2xl font-bold text-green-900">
                        {calculateTotalScore(currentScore)} / 48
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>Швы: {calculateSuturesTotal(currentScore.sutures)}/12</div>
                      <div>Амбулаторный прием: {calculateAmbulatoryTotal(currentScore.ambulatoryReception)}/12</div>
                      <div>Акушерское пособие: {calculateObstetricTotal(currentScore.obstetricAid)}/12</div>
                      <div>Лапароскопия: {calculateLaparoscopyTotal(currentScore.laparoscopy)}/12</div>
                    </div>
                  </div>

                  <button
                    onClick={saveScore}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Сохранить все оценки
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Выберите команду для начала оценки</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Информация о конкурсе</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Станция и участники команды определяются методом жеребьевки</p>
            <p>• Использование механических сшивающих аппаратов, кожного клея, пластыря исключается</p>
            <p>• Все действия необходимо комментировать вслух</p>
            <p>• За превышение лимита времени начисляются штрафные баллы (по 1 баллу за каждую лишнюю минуту)</p>
          </div>
        </div>
      </div>
    </div>
  );
}