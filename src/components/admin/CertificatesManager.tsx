'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Team, Participant } from '@/types';
import type { CertificateTemplatesConfig } from '@/types/certificate';

interface CertificatesManagerProps {
  eventId: string;
  teams: Team[];
  participants: Participant[];
  csrfToken?: string;
}

interface ParticipantInfo {
  teamId: string;
  teamName: string;
  members: string[];
  count: number;
}

const DEFAULT_TEMPLATES: CertificateTemplatesConfig = {
  email: {
    subject: 'Сертификат участника – {{eventName}}',
    greeting: 'Здравствуйте, {{recipientName}}!',
    bodyTeam: 'Ваша команда {{teamName}} приняла участие в мероприятии "{{eventName}}" и показала достойные результаты.',
    bodyIndividual: 'Вы приняли участие в мероприятии "{{eventName}}" и продемонстрировали высокий уровень знаний.',
    footer: 'С уважением,\n{{organizerName}}\n{{organizerTitle}}',
  },
  pdf: {
    teamTitle: 'СЕРТИФИКАТ',
    teamIntro: 'Настоящий сертификат подтверждает, что команда',
    individualTitle: 'ИМЕННОЙ СЕРТИФИКАТ',
    individualIntro: 'Настоящий сертификат выдан',
  },
  organizer: {
    name: 'Организационный комитет',
    title: 'Председатель оргкомитета',
    eventName: 'Олимпиада',
  },
};

export default function CertificatesManager({
  eventId,
  teams,
  participants,
  csrfToken,
}: CertificatesManagerProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'bulk' | 'settings'>('generate');
  const [selectedType, setSelectedType] = useState<'team' | 'individual'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [specialAward, setSpecialAward] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  
  // Bulk generation state
  const [bulkFormat, setBulkFormat] = useState<'pdf' | 'docx'>('pdf');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [allParticipantsInfo, setAllParticipantsInfo] = useState<ParticipantInfo[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  
  // Templates state
  const [templates, setTemplates] = useState<CertificateTemplatesConfig>(DEFAULT_TEMPLATES);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch(`/api/certificates/settings?eventId=${eventId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.templates) {
            setTemplates(data.templates);
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [eventId]);

  // Load participants info for bulk generation
  const loadParticipantsInfo = useCallback(async () => {
    setIsLoadingParticipants(true);
    try {
      const response = await fetch(`/api/certificates/all-participants?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setAllParticipantsInfo(data.teams || []);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    } finally {
      setIsLoadingParticipants(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (activeTab === 'bulk') {
      loadParticipantsInfo();
    }
  }, [activeTab, loadParticipantsInfo]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          eventId,
          teamId: selectedTeamId,
          participantName: selectedType === 'individual' 
            ? (() => {
                const p = participants.find(p => p.id === selectedParticipantId);
                return p ? `${p.lastName} ${p.firstName}` : undefined;
              })()
            : undefined,
          specialAward: specialAward || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${selectedType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Сертификат успешно сгенерирован и скачан' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка генерации' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!participantEmail) {
      setMessage({ type: 'error', text: 'Укажите email получателя' });
      return;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(participantEmail)) {
      setMessage({ type: 'error', text: 'Некорректный формат email' });
      return;
    }

    setShowConfirmSend(false);
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          eventId,
          teamId: selectedTeamId,
          participantName: selectedType === 'individual' 
            ? (() => {
                const p = participants.find(p => p.id === selectedParticipantId);
                return p ? `${p.lastName} ${p.firstName}` : undefined;
              })()
            : undefined,
          participantEmail,
          specialAward: specialAward || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка отправки');
      }

      setMessage({ type: 'success', text: `Сертификат успешно отправлен на ${participantEmail}` });
      setParticipantEmail('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка отправки' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedTeamIds.length === 0) {
      setMessage({ type: 'error', text: 'Выберите хотя бы одну команду' });
      return;
    }

    setIsBulkGenerating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/certificates/all-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          teamIds: selectedTeamIds,
          format: bulkFormat,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates-${bulkFormat}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Сертификаты успешно сгенерированы' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка генерации' 
      });
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setMessage(null);

    try {
      const response = await fetch('/api/certificates/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          eventId,
          templates,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      setMessage({ type: 'success', text: 'Настройки сохранены' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка сохранения' 
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const selectAllTeams = () => {
    setSelectedTeamIds(allParticipantsInfo.map(t => t.teamId));
  };

  const deselectAllTeams = () => {
    setSelectedTeamIds([]);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const totalSelectedParticipants = allParticipantsInfo
    .filter(t => selectedTeamIds.includes(t.teamId))
    .reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200" role="tablist" aria-label="Разделы управления сертификатами">
        <nav className="flex -mb-px flex-wrap">
          <button
            id="tab-generate"
            onClick={() => setActiveTab('generate')}
            role="tab"
            aria-selected={activeTab === 'generate'}
            aria-controls="panel-generate"
            tabIndex={activeTab === 'generate' ? 0 : -1}
            className={`px-4 sm:px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Генерация
          </button>
          <button
            id="tab-bulk"
            onClick={() => setActiveTab('bulk')}
            role="tab"
            aria-selected={activeTab === 'bulk'}
            aria-controls="panel-bulk"
            tabIndex={activeTab === 'bulk' ? 0 : -1}
            className={`px-4 sm:px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Массовая
          </button>
          <button
            id="tab-settings"
            onClick={() => setActiveTab('settings')}
            role="tab"
            aria-selected={activeTab === 'settings'}
            aria-controls="panel-settings"
            tabIndex={activeTab === 'settings' ? 0 : -1}
            className={`px-4 sm:px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Настройки
          </button>
        </nav>
      </div>

      {/* Message */}
      {message && (
        <div
          role="alert"
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Confirm Send Modal */}
      {showConfirmSend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-4">
              Подтверждение отправки
            </h3>
            <p className="text-gray-600 mb-6">
              Отправить сертификат на адрес <strong>{participantEmail}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmSend(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div id="panel-generate" role="tabpanel" aria-labelledby="tab-generate" className="bg-white rounded-lg shadow p-6">
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет команд</h3>
              <p className="text-gray-500">
                Добавьте команды в мероприятие, чтобы генерировать сертификаты
              </p>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Тип сертификата */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Тип сертификата
              </legend>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="certificateType"
                    value="team"
                    checked={selectedType === 'team'}
                    onChange={(e) => setSelectedType(e.target.value as 'team')}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span>Командный</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="certificateType"
                    value="individual"
                    checked={selectedType === 'individual'}
                    onChange={(e) => setSelectedType(e.target.value as 'individual')}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span>Именной</span>
                </label>
              </div>
            </fieldset>

            {/* Выбор команды */}
            <div>
              <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 mb-2">
                Команда
              </label>
              <select
                id="team-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Выберите команду</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Выбор участника (для именного) */}
            {selectedType === 'individual' && selectedTeam && (
              <div>
                <label htmlFor="participant-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Участник
                </label>
                <select
                  id="participant-select"
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите участника</option>
                  {participants
                    .filter(p => p.teamId === selectedTeamId)
                    .map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.lastName} {participant.firstName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Специальная награда */}
            {selectedType === 'individual' && (
              <div>
                <label htmlFor="special-award" className="block text-sm font-medium text-gray-700 mb-2">
                  Специальная награда (опционально)
                </label>
                <input
                  id="special-award"
                  type="text"
                  value={specialAward}
                  onChange={(e) => setSpecialAward(e.target.value)}
                  placeholder="Например: За лучшую презентацию"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Email для отправки */}
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-2">
                Email получателя (для отправки)
              </label>
              <input
                id="email-input"
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Предпросмотр сертификата */}
            {selectedTeamId && (selectedType === 'team' || selectedParticipantId) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Предпросмотр данных сертификата:</h4>
                <dl className="text-sm text-blue-800 space-y-1">
                  <div className="flex">
                    <dt className="w-32 font-medium">Тип:</dt>
                    <dd>{selectedType === 'team' ? 'Командный' : 'Именной'}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium">Команда:</dt>
                    <dd>{selectedTeam?.name}</dd>
                  </div>
                  {selectedType === 'individual' && selectedParticipantId && (
                    <div className="flex">
                      <dt className="w-32 font-medium">Участник:</dt>
                      <dd>
                        {(() => {
                          const p = participants.find(p => p.id === selectedParticipantId);
                          return p ? `${p.lastName} ${p.firstName}` : '';
                        })()}
                      </dd>
                    </div>
                  )}
                  {specialAward && (
                    <div className="flex">
                      <dt className="w-32 font-medium">Награда:</dt>
                      <dd>{specialAward}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Действия */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <button
                onClick={handleGenerate}
                disabled={!selectedTeamId || isGenerating || (selectedType === 'individual' && !selectedParticipantId)}
                aria-busy={isGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Генерация...
                  </>
                ) : (
                  <>📄 Скачать PDF</>
                )}
              </button>
              <button
                onClick={() => setShowConfirmSend(true)}
                disabled={!selectedTeamId || !participantEmail || isSending || (selectedType === 'individual' && !selectedParticipantId)}
                aria-busy={isSending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Отправка...
                  </>
                ) : (
                  <>📧 Отправить на Email</>
                )}
              </button>
            </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Generation Tab */}
      {activeTab === 'bulk' && (
        <div id="panel-bulk" role="tabpanel" aria-labelledby="tab-bulk" className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Массовая генерация сертификатов
              </h3>
              <p className="text-sm text-gray-600">
                Выберите команды для генерации сертификатов всем участникам. 
                Сертификаты будут скачаны в ZIP-архиве.
              </p>
            </div>

            {/* Format selection */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Формат файлов
              </legend>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    value="pdf"
                    checked={bulkFormat === 'pdf'}
                    onChange={(e) => setBulkFormat(e.target.value as 'pdf')}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span>PDF (макс. 15 участников)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    value="docx"
                    checked={bulkFormat === 'docx'}
                    onChange={(e) => setBulkFormat(e.target.value as 'docx')}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span>DOCX (макс. 30 участников)</span>
                </label>
              </div>
            </fieldset>

            {/* Team selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Выберите команды
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllTeams}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Выбрать все
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllTeams}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Снять выбор
                  </button>
                </div>
              </div>

              {isLoadingParticipants ? (
                <div className="text-center py-8 text-gray-500">
                  Загрузка списка участников...
                </div>
              ) : allParticipantsInfo.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Нет команд с участниками
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                  {allParticipantsInfo.map((team) => (
                    <label
                      key={team.teamId}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(team.teamId)}
                        onChange={() => toggleTeamSelection(team.teamId)}
                        className="w-4 h-4 text-blue-600 rounded mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{team.teamName}</div>
                        <div className="text-sm text-gray-500">
                          {team.count} участник{team.count === 1 ? '' : team.count < 5 ? 'а' : 'ов'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Summary and action */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Выбрано: <strong>{selectedTeamIds.length}</strong> команд, 
                <strong> {totalSelectedParticipants}</strong> участников
              </div>
              <button
                onClick={handleBulkGenerate}
                disabled={selectedTeamIds.length === 0 || isBulkGenerating || totalSelectedParticipants > (bulkFormat === 'pdf' ? 15 : 30)}
                aria-busy={isBulkGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isBulkGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Генерация...
                  </>
                ) : (
                  <>📦 Скачать ZIP</>
                )}
              </button>
            </div>

            {totalSelectedParticipants > (bulkFormat === 'pdf' ? 15 : 30) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ Выбрано слишком много участников. Максимум {bulkFormat === 'pdf' ? 15 : 30} за один раз.
                Выберите меньше команд или разделите на несколько запросов.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" className="bg-white rounded-lg shadow p-6">
          {isLoadingTemplates ? (
            <div className="text-center py-8 text-gray-500">Загрузка настроек...</div>
          ) : (
            <div className="space-y-8">
              {/* Organizer Settings */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация об организаторе</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Название мероприятия
                    </label>
                    <input
                      id="event-name"
                      type="text"
                      value={templates.organizer.eventName}
                      onChange={(e) => setTemplates({
                        ...templates,
                        organizer: { ...templates.organizer, eventName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizer-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Организатор
                    </label>
                    <input
                      id="organizer-name"
                      type="text"
                      value={templates.organizer.name}
                      onChange={(e) => setTemplates({
                        ...templates,
                        organizer: { ...templates.organizer, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="organizer-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Должность подписанта
                    </label>
                    <input
                      id="organizer-title"
                      type="text"
                      value={templates.organizer.title}
                      onChange={(e) => setTemplates({
                        ...templates,
                        organizer: { ...templates.organizer, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Email Templates */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Шаблоны email</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Доступные переменные: {'{{recipientName}}'}, {'{{teamName}}'}, {'{{eventName}}'}, {'{{organizerName}}'}, {'{{organizerTitle}}'}, {'{{place}}'}, {'{{score}}'}
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Тема письма
                    </label>
                    <input
                      id="email-subject"
                      type="text"
                      value={templates.email.subject}
                      onChange={(e) => setTemplates({
                        ...templates,
                        email: { ...templates.email, subject: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email-greeting" className="block text-sm font-medium text-gray-700 mb-1">
                      Приветствие
                    </label>
                    <input
                      id="email-greeting"
                      type="text"
                      value={templates.email.greeting}
                      onChange={(e) => setTemplates({
                        ...templates,
                        email: { ...templates.email, greeting: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email-body-team" className="block text-sm font-medium text-gray-700 mb-1">
                      Текст для командного сертификата
                    </label>
                    <textarea
                      id="email-body-team"
                      value={templates.email.bodyTeam}
                      onChange={(e) => setTemplates({
                        ...templates,
                        email: { ...templates.email, bodyTeam: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email-body-individual" className="block text-sm font-medium text-gray-700 mb-1">
                      Текст для именного сертификата
                    </label>
                    <textarea
                      id="email-body-individual"
                      value={templates.email.bodyIndividual}
                      onChange={(e) => setTemplates({
                        ...templates,
                        email: { ...templates.email, bodyIndividual: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email-footer" className="block text-sm font-medium text-gray-700 mb-1">
                      Подпись письма
                    </label>
                    <textarea
                      id="email-footer"
                      value={templates.email.footer}
                      onChange={(e) => setTemplates({
                        ...templates,
                        email: { ...templates.email, footer: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* PDF Templates */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Шаблоны PDF</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pdf-team-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Заголовок командного сертификата
                    </label>
                    <input
                      id="pdf-team-title"
                      type="text"
                      value={templates.pdf.teamTitle}
                      onChange={(e) => setTemplates({
                        ...templates,
                        pdf: { ...templates.pdf, teamTitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pdf-individual-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Заголовок именного сертификата
                    </label>
                    <input
                      id="pdf-individual-title"
                      type="text"
                      value={templates.pdf.individualTitle}
                      onChange={(e) => setTemplates({
                        ...templates,
                        pdf: { ...templates.pdf, individualTitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pdf-team-intro" className="block text-sm font-medium text-gray-700 mb-1">
                      Вступительный текст (командный)
                    </label>
                    <input
                      id="pdf-team-intro"
                      type="text"
                      value={templates.pdf.teamIntro}
                      onChange={(e) => setTemplates({
                        ...templates,
                        pdf: { ...templates.pdf, teamIntro: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pdf-individual-intro" className="block text-sm font-medium text-gray-700 mb-1">
                      Вступительный текст (именной)
                    </label>
                    <input
                      id="pdf-individual-intro"
                      type="text"
                      value={templates.pdf.individualIntro}
                      onChange={(e) => setTemplates({
                        ...templates,
                        pdf: { ...templates.pdf, individualIntro: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  aria-busy={isSavingSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSavingSettings ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    <>💾 Сохранить настройки</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}