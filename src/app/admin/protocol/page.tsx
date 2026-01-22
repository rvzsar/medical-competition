"use client";

/**
 * Протокол оценок жюри
 * 
 * Показывает историю всех изменений оценок в системе.
 * Работает с универсальной системой мероприятий.
 */

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

interface ScoreLogEntry {
  timestamp: string;
  juryId: string;
  juryName: string;
  teamId: string;
  teamName: string;
  contestId: string;
  contestName?: string;
  eventId?: string;
  eventName?: string;
  previousScore: number | null;
  newScore: number;
}

export default function ProtocolPage() {
  const [entries, setEntries] = useState<ScoreLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/protocol?limit=200");
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || "Не удалось загрузить протокол оценок");
          return;
        }

        setEntries(result.log || []);
      } catch (e) {
        console.error("Error loading protocol:", e);
        setError("Ошибка при загрузке протокола оценок");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Форматирование названия конкурса
  const formatContestName = (entry: ScoreLogEntry): string => {
    // Если есть название конкурса из API - используем его
    if (entry.contestName) {
      return entry.contestName;
    }
    // Иначе показываем ID
    return entry.contestId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Мероприятия', href: '/admin' },
            { label: 'Протокол оценок' }
          ]}
          className="mb-4"
        />

        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Протокол оценок жюри</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Журнал всех изменений баллов: кто, когда и какой балл поставил или изменил.
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Загрузка протокола…</span>
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-lg bg-red-100 border border-red-300 p-4 text-sm text-red-800" role="alert">
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <p className="text-gray-600">Пока нет записей в протоколе.</p>
            <p className="text-gray-500 text-sm mt-2">
              Записи появятся после того, как жюри начнёт выставлять оценки.
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                Показано записей: <strong>{entries.length}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700 font-medium">Время</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-medium">Конкурс</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-medium">Команда/Участник</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-medium">Член жюри</th>
                    <th className="px-4 py-3 text-right text-gray-700 font-medium">Было</th>
                    <th className="px-4 py-3 text-right text-gray-700 font-medium">Стало</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-medium">Изменение</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry, index) => {
                    const date = new Date(entry.timestamp);
                    const when = isNaN(date.getTime())
                      ? entry.timestamp
                      : date.toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                    const diff = entry.previousScore !== null 
                      ? entry.newScore - entry.previousScore 
                      : entry.newScore;
                    const isIncrease = diff > 0;
                    const isDecrease = diff < 0;

                    return (
                      <tr
                        key={`${entry.timestamp}-${entry.teamId}-${entry.juryId}-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {when}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                          {formatContestName(entry)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 font-medium">
                          {entry.teamName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {entry.juryName}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {entry.previousScore === null ? "—" : entry.previousScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {entry.newScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isIncrease 
                              ? 'bg-green-100 text-green-800' 
                              : isDecrease 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isIncrease && '+'}
                            {diff.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
