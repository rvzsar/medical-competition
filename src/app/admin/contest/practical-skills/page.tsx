"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, PracticalSkillsScore, SuturesScore, AmbulatoryReceptionScore, ObstetricAidScore, LaparoscopyScore, TeamScore } from "@/types";
import { storageUtils } from "@/utils/serverStorage";

export default function PracticalSkillsContestPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentJury, setCurrentJury] = useState<any>(null);
  const [scores, setScores] = useState<{ [key: string]: PracticalSkillsScore }>({});
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
        const practicalSkillsScores = contestScores.filter(score => score.contestId === 'practical-skills');
        setTeamScores(practicalSkillsScores);

        // Загружаем оценки текущего члена жюри
        const juryScores = practicalSkillsScores.filter(score => score.juryId === jury.id);
        const juryScoresMap: { [key: string]: PracticalSkillsScore } = {};
        
        juryScores.forEach(score => {
          if (score.details) {
            juryScoresMap[score.teamId] = score.details as PracticalSkillsScore;
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

  const saveScore = async () => {
    if (!selectedTeam || !currentJury) return;

    const teamScore: TeamScore = {
      teamId: selectedTeam,
      contestId: 'practical-skills',
      juryId: currentJury.id,
      score: calculateTotalScore(currentScore),
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
      const practicalSkillsScores = updatedScores.filter(score => score.contestId === 'practical-skills');
      setTeamScores(practicalSkillsScores);

      const action = isEditing ? 'обновлена' : 'сохранена';
      alert(`Оценка для команды ${teams.find(t => t.id === selectedTeam)?.name} ${action}!`);
      
      // Сбрасываем форму
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
      setIsEditing(false);
    }
    setSelectedTeam(teamId);
    setSelectedStation("sutures");
    setHasUnsavedChanges(false);
  };

  const getTeamTotalScore = (teamId: string) => {
    const score = scores[teamId];
    return score ? calculateTotalScore(score) : 0;
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              sutures: { ...currentScore.sutures, aesthetics: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              sutures: { ...currentScore.sutures, adaptation: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              sutures: { ...currentScore.sutures, technique: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              sutures: { ...currentScore.sutures, time: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              ambulatoryReception: { ...currentScore.ambulatoryReception, preparation: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              ambulatoryReception: { ...currentScore.ambulatoryReception, technique: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              ambulatoryReception: { ...currentScore.ambulatoryReception, completion: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              obstetricAid: { ...currentScore.obstetricAid, correctness: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              obstetricAid: { ...currentScore.obstetricAid, safety: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              obstetricAid: { ...currentScore.obstetricAid, time: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
          onChange={(e) => {
            setCurrentScore({
              ...currentScore,
              obstetricAid: { ...currentScore.obstetricAid, teamwork: Number(e.target.value) }
            });
            setHasUnsavedChanges(true);
          }}
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
                onChange={(e) => {
                  setCurrentScore({
                    ...currentScore,
                    laparoscopy: {
                      ...currentScore.laparoscopy,
                      [exercise.key]: {
                        ...currentScore.laparoscopy[exercise.key as keyof typeof currentScore.laparoscopy],
                        accuracy: Number(e.target.value)
                      }
                    }
                  });
                  setHasUnsavedChanges(true);
                }}
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
                onChange={(e) => {
                  setCurrentScore({
                    ...currentScore,
                    laparoscopy: {
                      ...currentScore.laparoscopy,
                      [exercise.key]: {
                        ...currentScore.laparoscopy[exercise.key as keyof typeof currentScore.laparoscopy],
                        trajectory: Number(e.target.value)
                      }
                    }
                  });
                  setHasUnsavedChanges(true);
                }}
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
              <p className="text-gray-600 mt-2">Оценка практических навыков на 4 станциях (макс. 52 балла)</p>
              {currentJury && (
                <p className="text-sm text-blue-600 mt-1">Оценивает: {currentJury.name}</p>
              )}
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
                    {team.name} (ваша оценка: {getTeamTotalScore(team.id)}/52)
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
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {isEditing ? 'Редактирование оценки' : 'Оценка станции'}
              {isEditing && (
                <span className="ml-2 text-sm text-blue-600 font-medium">(режим редактирования)</span>
              )}
            </h2>
            
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
                        {calculateTotalScore(currentScore)} / 52
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>Швы: {calculateSuturesTotal(currentScore.sutures)}/12</div>
                      <div>Амбулаторный прием: {calculateAmbulatoryTotal(currentScore.ambulatoryReception)}/12</div>
                      <div>Акушерское пособие: {calculateObstetricTotal(currentScore.obstetricAid)}/12</div>
                      <div>Лапароскопия: {calculateLaparoscopyTotal(currentScore.laparoscopy)}/12</div>
                    </div>
                    {selectedTeam && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-green-700">Средний балл команды:</span>
                          <span className="font-bold text-green-800">
                            {getTeamAggregatedScore(selectedTeam)} / 52
                          </span>
                        </div>
                        {getJuryCount(selectedTeam) > 1 && (
                          <div className="text-xs text-green-600 mt-1">
                            Оценок от жюри: {getJuryCount(selectedTeam)}
                          </div>
                        )}
                      </div>
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
                      {isEditing ? 'Обновить оценку' : 'Сохранить все оценки'}
                    </button>
                  </div>
                  {hasUnsavedChanges && (
                    <p className="text-sm text-orange-600 text-center mt-2">
                      ⚠️ Есть несохраненные изменения
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Выберите команду для начала оценки</p>
              </div>
            )}
          </div>
        </div>

        {/* Таблица результатов */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Текущие результаты</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        aggregatedScore >= 40 ? 'bg-green-100 text-green-800' :
                        aggregatedScore >= 30 ? 'bg-yellow-100 text-yellow-800' :
                        aggregatedScore > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {aggregatedScore} / 52
                      </span>
                    </div>
                  </div>
                  
                  {score ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Швы: {calculateSuturesTotal(score.sutures)}/12</div>
                      <div>Амбулаторный: {calculateAmbulatoryTotal(score.ambulatoryReception)}/12</div>
                      <div>Акушерство: {calculateObstetricTotal(score.obstetricAid)}/12</div>
                      <div>Лапароскопия: {calculateLaparoscopyTotal(score.laparoscopy)}/12</div>
                      <div className="font-semibold text-blue-600 pt-2 border-t">
                        Ваша оценка: {myScore}/52
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

        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Информация о конкурсе</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Станция и участники команды определяются методом жеребьевки</p>
            <p>• Использование механических сшивающих аппаратов, кожного клея, пластыря исключается</p>
            <p>• Все действия необходимо комментировать вслух</p>
            <p>• За превышение лимита времени начисляются штрафные баллы (по 1 баллу за каждую лишнюю минуту)</p>
            <p>• Максимальный балл: 52 балла (12 + 12 + 12 + 16 по станциям)</p>
            <p>• Оценки нескольких членов жюри усредняются автоматически</p>
          </div>
        </div>
      </div>
    </div>
  );
}