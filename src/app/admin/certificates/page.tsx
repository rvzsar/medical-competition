'use client';

import React, { useState, useEffect } from 'react';
import { Team } from '@/types';

interface CertificateRecipient {
  type: 'team' | 'individual';
  teamId: string;
  teamName: string;
  participantName?: string;
  participantEmail: string;
  specialAward?: string;
  place?: number;
  score?: number;
}

export default function CertificatesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [certificateType, setCertificateType] = useState<'team' | 'individual'>('team');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [specialAward, setSpecialAward] = useState('');
  const [sending, setSending] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState<CertificateRecipient[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
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

  const handleGenerateCertificate = async () => {
    if (!selectedTeam) {
      setMessage({ type: 'error', text: 'Выберите команду' });
      return;
    }

    if (certificateType === 'individual' && !participantName) {
      setMessage({ type: 'error', text: 'Введите имя участника' });
      return;
    }

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: certificateType,
          teamId: selectedTeam,
          participantName: certificateType === 'individual' ? participantName : undefined,
          specialAward: specialAward || undefined,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificateType}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage({ type: 'success', text: 'Сертификат успешно сгенерирован' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Ошибка генерации' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при генерации сертификата' });
    }
  };

  const handleSendCertificate = async () => {
    if (!selectedTeam || !participantEmail) {
      setMessage({ type: 'error', text: 'Заполните все обязательные поля' });
      return;
    }

    if (certificateType === 'individual' && !participantName) {
      setMessage({ type: 'error', text: 'Введите имя участника' });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: certificateType,
          teamId: selectedTeam,
          participantName: certificateType === 'individual' ? participantName : undefined,
          participantEmail,
          specialAward: specialAward || undefined,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Сертификат успешно отправлен на email' });
        setParticipantEmail('');
        setParticipantName('');
        setSpecialAward('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка отправки' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при отправке сертификата' });
    } finally {
      setSending(false);
    }
  };

  const addToBulk = () => {
    if (!selectedTeam || !participantEmail) {
      setMessage({ type: 'error', text: 'Заполните все обязательные поля' });
      return;
    }

    if (certificateType === 'individual' && !participantName) {
      setMessage({ type: 'error', text: 'Введите имя участника' });
      return;
    }

    const team = teams.find(t => t.id === selectedTeam);
    if (!team) return;

    const recipient: CertificateRecipient = {
      type: certificateType,
      teamId: selectedTeam,
      teamName: team.name,
      participantName: certificateType === 'individual' ? participantName : undefined,
      participantEmail,
      specialAward: specialAward || undefined,
    };

    setBulkRecipients([...bulkRecipients, recipient]);
    setParticipantEmail('');
    setParticipantName('');
    setSpecialAward('');
    setMessage({ type: 'success', text: 'Получатель добавлен в список' });
  };

  const removeFromBulk = (index: number) => {
    setBulkRecipients(bulkRecipients.filter((_, i) => i !== index));
  };

  const handleBulkSend = async () => {
    if (bulkRecipients.length === 0) {
      setMessage({ type: 'error', text: 'Список получателей пуст' });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/certificates/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: bulkRecipients }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Отправлено ${result.results?.length || 0} сертификатов` 
        });
        setBulkRecipients([]);
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка массовой отправки' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при массовой отправке' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📜 Управление сертификатами
          </h1>
          <p className="text-gray-600">
            Генерация и отправка сертификатов участникам олимпиады
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {bulkMode ? 'Массовая отправка' : 'Одиночная отправка'}
            </h2>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              {bulkMode ? '← Одиночный режим' : 'Массовый режим →'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип сертификата *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="team"
                    checked={certificateType === 'team'}
                    onChange={(e) => setCertificateType(e.target.value as 'team' | 'individual')}
                    className="mr-2"
                  />
                  Командный
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="individual"
                    checked={certificateType === 'individual'}
                    onChange={(e) => setCertificateType(e.target.value as 'team' | 'individual')}
                    className="mr-2"
                  />
                  Именной
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Команда *
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите команду</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {certificateType === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя участника *
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email получателя *
              </label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="participant@example.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Специальная номинация (необязательно)
              </label>
              <input
                type="text"
                value={specialAward}
                onChange={(e) => setSpecialAward(e.target.value)}
                placeholder="Лучшие практические навыки"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerateCertificate}
              disabled={sending}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              📥 Скачать PDF
            </button>

            {!bulkMode ? (
              <button
                onClick={handleSendCertificate}
                disabled={sending}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {sending ? 'Отправка...' : '📧 Отправить на Email'}
              </button>
            ) : (
              <button
                onClick={addToBulk}
                disabled={sending}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400"
              >
                ➕ Добавить в список
              </button>
            )}
          </div>
        </div>

        {bulkMode && bulkRecipients.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Список получателей ({bulkRecipients.length})
              </h2>
              <button
                onClick={handleBulkSend}
                disabled={sending}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {sending ? 'Отправка...' : '🚀 Отправить все'}
              </button>
            </div>

            <div className="space-y-3">
              {bulkRecipients.map((recipient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {recipient.type === 'team' ? '👥' : '👤'} {recipient.teamName}
                      {recipient.participantName && ` - ${recipient.participantName}`}
                    </div>
                    <div className="text-sm text-gray-600">{recipient.participantEmail}</div>
                    {recipient.specialAward && (
                      <div className="text-sm text-purple-600">🏆 {recipient.specialAward}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromBulk(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}