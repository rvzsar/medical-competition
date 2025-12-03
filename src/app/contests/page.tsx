"use client";

import Link from "next/link";
import { CONTESTS, PRACTICAL_STATIONS, Contest, Station } from "@/config/contests";

export default function ContestsPage() {
  const getColorClasses = (contestId: string) => {
    switch (contestId) {
      case "visit-card":
        return "bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800";
      case "clinical-case":
        return "bg-green-100 border-green-300 hover:bg-green-200 text-green-800";
      case "practical-skills":
        return "bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-800";
      case "mind-battle":
        return "bg-orange-100 border-orange-300 hover:bg-orange-200 text-orange-800";
      case "jury-question":
        return "bg-red-100 border-red-300 hover:bg-red-200 text-red-800";
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800";
    }
  };

  const getStationColorClasses = (index: number) => {
    const colors = [
      "bg-indigo-50 border-indigo-200 text-indigo-800",
      "bg-teal-50 border-teal-200 text-teal-800",
      "bg-pink-50 border-pink-200 text-pink-800",
      "bg-amber-50 border-amber-200 text-amber-800",
    ];
    return colors[index % colors.length];
  };

  const renderContest = (contest: Contest) => {
    const isPracticalSkills = contest.id === "practical-skills";
    const isJuryQuestion = contest.id === "jury-question";

    return (
      <div
        key={contest.id}
        className={`border-2 rounded-lg p-6 transition-colors ${getColorClasses(contest.id)}`}
      >
        <h2 className="text-xl font-bold mb-3">{contest.name}</h2>
        <p className="text-sm mb-4">{contest.description}</p>

        {isJuryQuestion && (
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
          {contest.hasBonus && (
            <div className="text-xs mt-2 p-1 bg-green-200 rounded">
              ✓ Возможен бонусный балл за досрочный ответ
            </div>
          )}
          {contest.hasPenalty && (
            <div className="text-xs mt-2 p-1 bg-yellow-200 rounded">
              ⚠ Штрафные баллы за превышение времени
            </div>
          )}
        </div>

        {/* Критерии оценки */}
        {contest.criteria.length > 0 && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            <h4 className="font-semibold text-sm mb-2">Критерии оценки:</h4>
            <ul className="text-xs space-y-1">
              {contest.criteria.map((criterion) => (
                <li key={criterion.id} className="flex justify-between">
                  <span>• {criterion.name}</span>
                  <span className="font-medium">до {criterion.maxScore} б.</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Станции для практических навыков */}
        {isPracticalSkills && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            <h4 className="font-semibold text-sm mb-2">Станции (по 12 баллов каждая):</h4>
            <ul className="text-xs space-y-1">
              {PRACTICAL_STATIONS.map((station) => (
                <li key={station.id}>• {station.name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <Link
            href={`/admin/contest/${contest.id}`}
            className={`inline-block w-full text-center px-3 py-2 rounded border border-current text-sm font-medium hover:bg-current hover:bg-opacity-20 transition-colors ${
              isJuryQuestion ? "opacity-75" : ""
            }`}
          >
            {isJuryQuestion ? "Использовать при необходимости" : "Оценить конкурс"}
          </Link>
        </div>
      </div>
    );
  };

  const renderStation = (station: Station, index: number) => (
    <div
      key={station.id}
      className={`border-2 rounded-lg p-4 ${getStationColorClasses(index)}`}
    >
      <h3 className="font-bold mb-2">{station.name}</h3>
      <div className="flex justify-between text-sm mb-3">
        <span>Максимальный балл:</span>
        <span className="font-bold">{station.maxScore}</span>
      </div>
      
      {station.hasPenalty && (
        <div className="text-xs mb-2 p-1 bg-yellow-200 rounded text-yellow-800">
          ⚠ Штрафные баллы за превышение времени
        </div>
      )}

      <div className="border-t pt-2 mt-2">
        <h4 className="text-xs font-semibold mb-1">Критерии:</h4>
        <ul className="text-xs space-y-1">
          {station.criteria.map((criterion) => (
            <li key={criterion.id} className="flex justify-between">
              <span>• {criterion.name}</span>
              <span className="font-medium">{criterion.maxScore} б.</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

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

        {/* Основные конкурсы */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {CONTESTS.map((contest) => renderContest(contest))}
        </div>

        {/* Станции практических навыков */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Станции практических навыков
          </h2>
          <p className="text-gray-600 mb-4">
            Каждая станция оценивается максимум в 12 баллов. Общий максимум за практические навыки: 48 баллов.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PRACTICAL_STATIONS.map((station, index) => renderStation(station, index))}
          </div>
        </div>

        {/* Общая информация */}
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
            <div>
              <h3 className="font-semibold mb-2">Максимальные баллы:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Визитка: 6 баллов</li>
                <li>• Клинический случай: 4 балла</li>
                <li>• Практические навыки: 48 баллов (4 станции × 12)</li>
                <li>• Битва умов: 2 балла</li>
                <li className="font-bold pt-2 border-t">Итого: 60 баллов</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Награждение */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Награждение</h2>
          <div className="text-blue-700">
            <h3 className="font-semibold mb-2">Командные награды:</h3>
            <ul className="space-y-1 text-sm">
              <li>🥇 1 место - освобождение от экзамена с оценкой «отлично»</li>
              <li>🥈 2 место - +1 балл к экзамену</li>
              <li>🥉 3 место - +1 балл к экзамену</li>
              <li>🎬 Победитель конкурса «Визитка» - +1 балл к экзамену</li>
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
