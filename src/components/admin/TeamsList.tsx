'use client';

import { useState, useTransition } from 'react';
import { createTeam, updateTeam, deleteTeam } from '@/actions/teams';
import { createParticipant, updateParticipant, deleteParticipant } from '@/actions/participants';
import type { Team, Participant } from '@/types';

interface TeamsListProps {
  teams: Team[];
  participants: Participant[];
  eventId: string;
  csrfToken: string;
}

export default function TeamsList({ teams, participants, eventId, csrfToken }: TeamsListProps) {
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [teamForm, setTeamForm] = useState({
    name: '',
    institution: '',
    members: [''],
    contactEmail: '',
    contactPhone: '',
  });

  const [participantForm, setParticipantForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    institution: '',
    course: '',
    contactEmail: '',
    contactPhone: '',
  });

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    setError(null);

    startTransition(async () => {
      const result = editingTeam
        ? await updateTeam(editingTeam.id, teamForm, csrfToken)
        : await createTeam({ ...teamForm, eventId }, csrfToken);

      if (result.success) {
        setShowTeamForm(false);
        setEditingTeam(null);
        setTeamForm({ name: '', institution: '', members: [''], contactEmail: '', contactPhone: '' });
      } else {
        setError(result.error);
      }
    });
  };

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    setError(null);

    startTransition(async () => {
      const result = editingParticipant
        ? await updateParticipant(editingParticipant.id, participantForm, csrfToken)
        : await createParticipant({ ...participantForm, eventId }, csrfToken);

      if (result.success) {
        setShowParticipantForm(false);
        setEditingParticipant(null);
        setParticipantForm({ firstName: '', lastName: '', middleName: '', institution: '', course: '', contactEmail: '', contactPhone: '' });
      } else {
        setError(result.error);
      }
    });
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Удалить команду "${teamName}"?`)) return;
    if (isPending) return;

    startTransition(async () => {
      const result = await deleteTeam(teamId, csrfToken);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleDeleteParticipant = async (participantId: string, name: string) => {
    if (!confirm(`Удалить участника "${name}"?`)) return;
    if (isPending) return;

    startTransition(async () => {
      const result = await deleteParticipant(participantId, csrfToken);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setShowTeamForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Добавить команду
        </button>
        <button
          onClick={() => setShowParticipantForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Добавить участника
        </button>
      </div>

      {(showTeamForm || editingTeam) && (
        <form onSubmit={handleTeamSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">
            {editingTeam ? 'Редактировать команду' : 'Новая команда'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название команды</label>
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Учебное заведение</label>
            <input
              type="text"
              value={teamForm.institution}
              onChange={(e) => setTeamForm({ ...teamForm, institution: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Участники</label>
            {teamForm.members.map((member, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => {
                    const newMembers = [...teamForm.members];
                    newMembers[idx] = e.target.value;
                    setTeamForm({ ...teamForm, members: newMembers });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="ФИО участника"
                  required
                />
                {teamForm.members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newMembers = teamForm.members.filter((_, i) => i !== idx);
                      setTeamForm({ ...teamForm, members: newMembers });
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTeamForm({ ...teamForm, members: [...teamForm.members, ''] })}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Добавить участника
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              aria-busy={isPending}
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTeamForm(false);
                setEditingTeam(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {(showParticipantForm || editingParticipant) && (
        <form onSubmit={handleParticipantSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">
            {editingParticipant ? 'Редактировать участника' : 'Новый участник'}
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
              <input
                type="text"
                value={participantForm.lastName}
                onChange={(e) => setParticipantForm({ ...participantForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                value={participantForm.firstName}
                onChange={(e) => setParticipantForm({ ...participantForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
              <input
                type="text"
                value={participantForm.middleName}
                onChange={(e) => setParticipantForm({ ...participantForm, middleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Учебное заведение</label>
              <input
                type="text"
                value={participantForm.institution}
                onChange={(e) => setParticipantForm({ ...participantForm, institution: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Курс</label>
              <input
                type="text"
                value={participantForm.course}
                onChange={(e) => setParticipantForm({ ...participantForm, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              aria-busy={isPending}
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowParticipantForm(false);
                setEditingParticipant(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Команды ({teams.length})</h3>
          <div className="space-y-2">
            {teams.map((team) => (
              <div key={team.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{team.name}</h4>
                    {team.institution && (
                      <p className="text-sm text-gray-600">{team.institution}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Участников: {team.members.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTeam(team);
                        setTeamForm({
                          name: team.name,
                          institution: team.institution || '',
                          members: team.members,
                          contactEmail: team.contactEmail || '',
                          contactPhone: team.contactPhone || '',
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Участники ({participants.length})</h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      {participant.lastName} {participant.firstName} {participant.middleName}
                    </h4>
                    {participant.institution && (
                      <p className="text-sm text-gray-600">{participant.institution}</p>
                    )}
                    {participant.course && (
                      <p className="text-sm text-gray-500">{participant.course} курс</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingParticipant(participant);
                        setParticipantForm({
                          firstName: participant.firstName,
                          lastName: participant.lastName,
                          middleName: participant.middleName || '',
                          institution: participant.institution || '',
                          course: participant.course || '',
                          contactEmail: participant.contactEmail || '',
                          contactPhone: participant.contactPhone || '',
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDeleteParticipant(
                        participant.id,
                        `${participant.lastName} ${participant.firstName}`
                      )}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
