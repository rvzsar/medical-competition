"use client";

import Link from "next/link";

export default function ContestsPage() {
  const contests = [
    {
      id: "visit-card",
      name: "I конкурс. Визитка",
      description: "Устная презентация и/или видеоролик (до 3 минут)",
      maxScore: 6,
      timeLimit: "3 минуты",
      color: "blue",
    },
    {
      id: "clinical-case",
      name: "II конкурс. Клинический случай",
      description: "Решение ситуационной задачи",
      maxScore: 4,
      timeLimit: "10 минут",
      color: "green",
    },
    {
      id: "practical-skills",
      name: "III конкурс. Практические навыки",
      description: "Оценка на 4 станциях",
      maxScore: 48,
      timeLimit: "10 минут",
      color: "purple",
      stations: [
        "Швы при кесаревом сечении",
        "Амбулаторный прием",
        "Акушерское пособие в родах",
        "Лапароскопический симулятор"
      ]
    },
    {
      id: "mind-battle",
      name: "IV конкурс. Битва умов",
      description: "Вопросы командам-соперникам",
      maxScore: 2,
      timeLimit: "Без ограничений",
      color: "orange",
    },
    {
      id: "jury-question",
      name: "VI конкурс. Вопрос от жюри",
      description: "Дополнительные вопросы для спорных ситуаций",
      maxScore: 2,
      timeLimit: "Без ограничений",
      color: "red",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800";
      case "green":
        return "bg-green-100 border-green-300 hover:bg-green-200 text-green-800";
      case "purple":
        return "bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-800";
      case "orange":
        return "bg-orange-100 border-orange-300 hover:bg-orange-200 text-orange-800";
      case "red":
        return "bg-red-100 border-red-300 hover:bg-red-200 text-red-800";
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Конкурсы олимпиады</h1>
              <p className="text-gray-600 mt-2">Подробная информация о каждом конкурсе</p>
            </div>
            <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              На главную
            </Link>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className={`border-2 rounded-lg p-6 transition-colors ${getColorClasses(contest.color)}`}
            >
              <h2 className="text-xl font-bold mb-3">{contest.name}</h2>
              <p className="text-sm mb-4">{contest.description}</p>
              
              {contest.id === 'jury-question' && (
                <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded text-xs">
                  <p className="text-orange-800 font-medium">⚠️ Проводится только при необходимости</p>
                  <p className="text-orange-700">Используется при спорных ситуациях для выбора призовых мест</p>
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Максимальный балл:</span>
                  <span className="font-bold">{contest.maxScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Время:</span>
                  <span>{contest.timeLimit}</span>
                </div>
              </div>

              {contest.stations && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                  <h4 className="font-semibold text-sm mb-2">Станции:</h4>
                  <ul className="text-xs space-y-1">
                    {contest.stations.map((station, index) => (
                      <li key={index}>• {station}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href={`/admin/contest/${contest.id}`}
                  className={`inline-block w-full text-center px-3 py-2 rounded border border-current text-sm font-medium hover:bg-current hover:bg-opacity-20 transition-colors ${
                    contest.id === 'jury-question' ? 'opacity-75' : ''
                  }`}
                >
                  {contest.id === 'jury-question' ? 'Использовать при необходимости' : 'Оценить конкурс'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Общая информация</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Формат проведения:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Все конкурсы проводятся в командном зачете</li>
                <li>• Вручается специальный приз участнику с лучшими практическими навыками</li>
                <li>• Три команды с наибольшим количеством баллов получают призовые места</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Награждение</h2>
          <div className="text-blue-700">
            <h3 className="font-semibold mb-2">Командные награды:</h3>
            <ul className="space-y-1 text-sm">
              <li>🥇 1 место - освобождение от экзамена с оценкой "отлично"</li>
              <li>🥈 2 место - +1 балл к экзамену</li>
              <li>🥉 3 место - +1 балл к экзамену</li>
              <li>🎬 Победитель конкурса "Визитка" - +1 балл к экзамену</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/admin"
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
          >
            Перейти в панель жюри
          </Link>
        </div>
      </div>
    </div>
  );
}