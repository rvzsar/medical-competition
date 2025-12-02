'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TeamParticipants {
  teamId: string;
  teamName: string;
  members: string[];
  count: number;
}

export default function ParticipantCertificatesPage() {
  const [teams, setTeams] = useState<TeamParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const response = await fetch('/api/certificates/all-participants');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
        setTotalParticipants(data.totalParticipants);
      }
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedTeams.length === 0
    ? totalParticipants
    : teams
        .filter((t) => selectedTeams.includes(t.teamId))
        .reduce((sum, t) => sum + t.count, 0);

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTeams(teams.map((t) => t.teamId));
  };

  const handleDeselectAll = () => {
    setSelectedTeams([]);
  };

  const handleGenerate = async () => {
    if (selectedCount > 15) {
      setMessage({
        type: 'error',
        text: `Выбрано ${selectedCount} участников. Максимум 15 за раз. Выберите меньше команд.`,
      });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/certificates/all-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamIds: selectedTeams.length > 0 ? selectedTeams : undefined,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificates-participants-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setMessage({
          type: 'success',
          text: `Успешно сгенерировано ${selectedCount} сертификатов участников`,
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Ошибка генерации' });
      }
    } catch (error) {
      console.error('Ошибка при генерации:', error);
      setMessage({ type: 'error', text: 'Ошибка при генерации сертификатов' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/certificates"
              className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
            >
              ← Назад к управлению сертификатами
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🎓 Сертификаты участников
            </h1>
            <p className="text-gray-600">
              Генерация простых сертификатов за участие для всех участников
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                Всего участников: <strong>{totalParticipants}</strong>
              </span>
              <span className="text-indigo-600 font-medium">
                Выбрано: {selectedCount}
              </span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Warning */}
          {selectedCount > 15 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Внимание:</strong> Выбрано {selectedCount}{' '}
                участников. Максимум 15 за один запрос. Выберите меньше команд.
              </p>
            </div>
          )}

          {/* Team Selection */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Выберите команды (или оставьте пустым для всех)
              </label>
              <div className="space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Выбрать все
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Снять выбор
                </button>
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg p-4 max-h-80 overflow-y-auto">
              {teams.map((team) => (
                <label
                  key={team.teamId}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.teamId)}
                      onChange={() => handleToggleTeam(team.teamId)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-700">{team.teamName}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {team.count} участников
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || selectedCount === 0 || selectedCount > 15}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              generating || selectedCount === 0 || selectedCount > 15
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Генерация...
              </span>
            ) : (
              `🎓 Скачать ${selectedCount} сертификатов участников (ZIP)`
            )}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 Формат сертификата:</strong>
            </p>
            <div className="text-sm text-blue-700 font-mono bg-white p-3 rounded border">
              <p className="text-center">ВРУЧАЕТСЯ</p>
              <p className="text-center">_______________</p>
              <p className="text-center font-bold">Имя Участника</p>
              <p className="text-center mt-2">
                За участие в I Межвузовской олимпиаде
                <br />
                по акушерству и гинекологии
                <br />
                им. В.В. Горячева
              </p>
            </div>
          </div>

          {/* Limit info */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>⚡ Ограничение:</strong> Максимум 15 сертификатов за один
              запрос. Файлы организованы по папкам команд.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
