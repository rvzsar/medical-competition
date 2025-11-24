'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Team } from '@/types';

export default function BulkCertificatesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/data?type=teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentTeam = teams.find(t => t.id === selectedTeam);

  const handleToggleParticipant = (name: string) => {
    setSelectedParticipants(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    if (currentTeam) {
      setSelectedParticipants(currentTeam.members);
    }
  };

  const handleDeselectAll = () => {
    setSelectedParticipants([]);
  };

  const handleGenerate = async () => {
    if (!selectedTeam) {
      setMessage({ type: 'error', text: 'Выберите команду' });
      return;
    }

    if (selectedParticipants.length === 0) {
      setMessage({ type: 'error', text: 'Выберите хотя бы одного участника' });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/certificates/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam,
          participants: selectedParticipants,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificates-${currentTeam?.name.replace(/\s+/g, '-')}-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage({ 
          type: 'success', 
          text: `Успешно сгенерировано ${selectedParticipants.length} сертификатов` 
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Ошибка генерации' });
      }
    } catch (error) {
      console.error('Ошибка при генерации сертификатов:', error);
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
              📦 Массовая генерация сертификатов
            </h1>
            <p className="text-gray-600">
              Выберите команду и участников для генерации именных сертификатов
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Team Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите команду *
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setSelectedParticipants([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Выберите команду --</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.members.length} участников)
                </option>
              ))}
            </select>
          </div>

          {/* Participants Selection */}
          {currentTeam && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Выберите участников ({selectedParticipants.length} из {currentTeam.members.length})
                </label>
                <div className="space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Выбрать всех
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

              {/* Warning for too many participants */}
              {selectedParticipants.length > 7 && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Внимание:</strong> Выбрано {selectedParticipants.length} участников. 
                    Рекомендуется генерировать не более 7 сертификатов за раз 
                    из-за ограничений Vercel (timeout 10 секунд).
                  </p>
                </div>
              )}

              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                {currentTeam.members.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    В команде нет участников
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentTeam.members.map((member, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(member)}
                          onChange={() => handleToggleParticipant(member)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-gray-700">{member}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedTeam || selectedParticipants.length === 0}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                generating || !selectedTeam || selectedParticipants.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
                `📥 Скачать ${selectedParticipants.length} сертификатов (ZIP)`
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 Подсказка:</strong> Все сертификаты будут упакованы в ZIP архив. 
              Каждый файл будет назван по имени участника. Сертификаты готовы для печати 
              на готовых бланках А4 в альбомной ориентации.
            </p>
            <p className="text-sm text-blue-800">
              <strong>⚡ Ограничение:</strong> Максимум 7 сертификатов за один запрос. 
              Для больших команд генерируйте сертификаты несколькими запросами.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
