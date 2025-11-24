'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [showSettings, setShowSettings] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesSaving, setTemplatesSaving] = useState(false);
  const [templates, setTemplates] = useState<{
    emailSubject: string;
    emailGreeting: string;
    emailBodyTeam: string;
    emailBodyIndividual: string;
    emailFooter: string;
    pdfTeamTitle: string;
    pdfTeamIntro: string;
    pdfIndividualTitle: string;
    pdfIndividualIntro: string;
    organizerName: string;
    organizerTitle: string;
    eventName: string;
  } | null>(null);

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
      console.error('Ошибка при генерации сертификата:', error);
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
      console.error('Ошибка при отправке сертификата:', error);
      setMessage({ type: 'error', text: 'Ошибка при отправке сертификата' });
    } finally {
      setSending(false);
    }
  };

  const handleTestSendCertificate = async () => {
    // Простейшая защита: не даем отправлять тест без явного email и команды
    if (!selectedTeam || !participantEmail) {
      setMessage({ type: 'error', text: 'Для тестовой отправки выберите команду и укажите email' });
      return;
    }

    // Небольшая валидация email на стороне клиента, чтобы не улетали мусорные адреса
    const emailTrimmed = participantEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setMessage({ type: 'error', text: 'Похоже, email указан с ошибкой' });
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
          participantName:
            certificateType === 'individual'
              ? participantName || 'Тестовая отправка'
              : undefined,
          participantEmail: emailTrimmed,
          specialAward: 'ТЕСТОВОЕ ПИСЬМО (сертификат не предназначен для печати)',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Тестовое письмо отправлено. Проверьте почту (и папку "Спам").',
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка тестовой отправки' });
      }
    } catch (error) {
      console.error('Ошибка при тестовой отправке сертификата:', error);
      setMessage({ type: 'error', text: 'Ошибка при тестовой отправке сертификата' });
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
      console.error('Ошибка при массовой отправке:', error);
      setMessage({ type: 'error', text: 'Ошибка при массовой отправке' });
    } finally {
      setSending(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/certificates/settings');
      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage({ type: 'error', text: result.error || 'Не удалось загрузить шаблоны' });
        return;
      }

      const t = result.templates;
      setTemplates({
        emailSubject: t.email.subject,
        emailGreeting: t.email.greeting,
        emailBodyTeam: t.email.bodyTeam,
        emailBodyIndividual: t.email.bodyIndividual,
        emailFooter: t.email.footer,
        pdfTeamTitle: t.pdf.teamTitle,
        pdfTeamIntro: t.pdf.teamIntro,
        pdfIndividualTitle: t.pdf.individualTitle,
        pdfIndividualIntro: t.pdf.individualIntro,
        organizerName: t.organizer.name,
        organizerTitle: t.organizer.title,
        eventName: t.organizer.eventName,
      });
    } catch (error) {
      console.error('Ошибка при загрузке шаблонов сертификатов:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке шаблонов' });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const toggleSettings = async () => {
    const next = !showSettings;
    setShowSettings(next);
    if (next && !templates && !templatesLoading) {
      await loadTemplates();
    }
  };

  const handleSaveTemplates = async () => {
    if (!templates) return;

    setTemplatesSaving(true);
    try {
      const response = await fetch('/api/certificates/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templates: {
            email: {
              subject: templates.emailSubject,
              greeting: templates.emailGreeting,
              bodyTeam: templates.emailBodyTeam,
              bodyIndividual: templates.emailBodyIndividual,
              footer: templates.emailFooter,
            },
            pdf: {
              teamTitle: templates.pdfTeamTitle,
              teamIntro: templates.pdfTeamIntro,
              individualTitle: templates.pdfIndividualTitle,
              individualIntro: templates.pdfIndividualIntro,
            },
            organizer: {
              name: templates.organizerName,
              title: templates.organizerTitle,
              eventName: templates.eventName,
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage({ type: 'error', text: result.error || 'Не удалось сохранить шаблоны' });
        return;
      }

      setMessage({ type: 'success', text: 'Шаблоны успешно сохранены' });
    } catch (error) {
      console.error('Ошибка при сохранении шаблонов сертификатов:', error);
      setMessage({ type: 'error', text: 'Ошибка при сохранении шаблонов' });
    } finally {
      setTemplatesSaving(false);
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                📜 Управление сертификатами
              </h1>
              <p className="text-gray-600">
                Генерация и отправка сертификатов участникам олимпиады
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Назад к админке
            </Link>
          </div>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {bulkMode ? '← Одиночный режим' : 'Массовый режим →'}
              </button>
              <button
                type="button"
                onClick={toggleSettings}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
              >
                ⚙️ Настроить тексты
              </button>
            </div>
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
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={handleSendCertificate}
                  disabled={sending}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {sending ? 'Отправка...' : '📧 Отправить на Email'}
                </button>
                <button
                  type="button"
                  onClick={handleTestSendCertificate}
                  disabled={sending}
                  className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-200 transition disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {sending ? 'Тест...' : '🔐 Тестовая отправка (только на этот email)'}
                </button>
              </div>
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

        {showSettings && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Настройки текстов сертификатов</h2>
              <span className="text-sm text-gray-500 text-right">
                Куски вида {'{'}{'{'}...{'}'}{'}'} заполняются автоматически. Можно их просто оставить
                в тексте: {'{'}{'{'}recipientName{'}'}{'}'} – ФИО участника, {'{'}{'{'}teamName{'}'}{'}'} – команда,
                {'{'}{'{'}eventName{'}'}{'}'} – название олимпиады, {'{'}{'{'}place{'}'}{'}'} – место,
                {'{'}{'{'}score{'}'}{'}'} – балл, {'{'}{'{'}specialAward{'}'}{'}'} – спецприз,
                {'{'}{'{'}organizerName{'}'}{'}'} – ФИО организатора, {'{'}{'{'}organizerTitle{'}'}{'}'} – должность.
              </span>
            </div>

            {templatesLoading && (
              <div className="mb-4 text-gray-500">Загрузка шаблонов...</div>
            )}

            {templates && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Общие настройки</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название мероприятия
                      </label>
                      <input
                        type="text"
                        value={templates.eventName}
                        onChange={(e) =>
                          setTemplates({ ...templates, eventName: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ФИО организатора
                      </label>
                      <input
                        type="text"
                        value={templates.organizerName}
                        onChange={(e) =>
                          setTemplates({ ...templates, organizerName: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Должность организатора
                      </label>
                      <input
                        type="text"
                        value={templates.organizerTitle}
                        onChange={(e) =>
                          setTemplates({ ...templates, organizerTitle: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Email</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тема письма
                      </label>
                      <input
                        type="text"
                        value={templates.emailSubject}
                        onChange={(e) =>
                          setTemplates({ ...templates, emailSubject: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Приветствие
                      </label>
                      <input
                        type="text"
                        value={templates.emailGreeting}
                        onChange={(e) =>
                          setTemplates({ ...templates, emailGreeting: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Основной текст для командных сертификатов
                      </label>
                      <textarea
                        value={templates.emailBodyTeam}
                        onChange={(e) =>
                          setTemplates({ ...templates, emailBodyTeam: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Основной текст для именных сертификатов
                      </label>
                      <textarea
                        value={templates.emailBodyIndividual}
                        onChange={(e) =>
                          setTemplates({ ...templates, emailBodyIndividual: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Подпись (футер письма)
                      </label>
                      <textarea
                        value={templates.emailFooter}
                        onChange={(e) =>
                          setTemplates({ ...templates, emailFooter: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-24"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">PDF сертификаты (текстовые поля)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Заголовок командного сертификата
                      </label>
                      <input
                        type="text"
                        value={templates.pdfTeamTitle}
                        onChange={(e) =>
                          setTemplates({ ...templates, pdfTeamTitle: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Подводка командного сертификата
                      </label>
                      <input
                        type="text"
                        value={templates.pdfTeamIntro}
                        onChange={(e) =>
                          setTemplates({ ...templates, pdfTeamIntro: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Заголовок именного сертификата
                      </label>
                      <input
                        type="text"
                        value={templates.pdfIndividualTitle}
                        onChange={(e) =>
                          setTemplates({ ...templates, pdfIndividualTitle: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Подводка именного сертификата
                      </label>
                      <input
                        type="text"
                        value={templates.pdfIndividualIntro}
                        onChange={(e) =>
                          setTemplates({ ...templates, pdfIndividualIntro: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={toggleSettings}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-200 text-sm"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleSaveTemplates}
                disabled={templatesSaving || templatesLoading || !templates}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:bg-gray-400"
              >
                {templatesSaving ? 'Сохранение...' : 'Сохранить шаблоны'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}