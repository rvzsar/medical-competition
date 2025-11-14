"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScoreLogEntry {
  timestamp: string;
  juryId: string;
  juryName: string;
  teamId: string;
  teamName: string;
  contestId: string;
  previousScore: number | null;
  newScore: number;
}

const contestNames: Record<string, string> = {
  "visit-card": "I. Визитка",
  "clinical-case": "II. Клинический случай",
  "practical-skills": "III. Практические навыки",
  "mind-battle": "IV. Битва умов",
  "jury-question": "VI. Вопрос от жюри",
};

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Протокол оценок жюри</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Краткий журнал всех изменений баллов: кто, когда и какой балл поставил или изменил.
            </p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm"
          >
            ← Назад в панель жюри
          </Link>
        </header>

        {loading && (
          <div className="text-gray-600">Загрузка протокола…</div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-lg bg-red-100 border border-red-300 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="text-gray-600 text-sm">Пока нет записей в протоколе.</div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700">Время</th>
                  <th className="px-3 py-2 text-left text-gray-700">Конкурс</th>
                  <th className="px-3 py-2 text-left text-gray-700">Команда</th>
                  <th className="px-3 py-2 text-left text-gray-700">Член жюри</th>
                  <th className="px-3 py-2 text-right text-gray-700">Было</th>
                  <th className="px-3 py-2 text-right text-gray-700">Стало</th>
                </tr>
              </thead>
              <tbody>
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

                  return (
                    <tr
                      key={`${entry.timestamp}-${entry.teamId}-${entry.juryId}-${index}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{when}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                        {contestNames[entry.contestId] || entry.contestId}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                        {entry.teamName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                        {entry.juryName}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {entry.previousScore === null ? "—" : entry.previousScore.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        {entry.newScore.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
