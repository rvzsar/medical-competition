"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Team, JuryMember } from "@/types";
import { storageUtils } from "@/utils/serverStorage";
import TeamScoreLoader from "@/components/TeamScoreLoader";

export default function AdminPage() {
  const router = useRouter();
  const [currentJury, setCurrentJury] = useState<JuryMember | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupData, setBackupData] = useState("");
  const [restoreData, setRestoreData] = useState("");

  useEffect(() => {
    const loadData = async () => {
      // Проверяем авторизацию
      const jury = storageUtils.getCurrentJury();
      if (!jury) {
        router.push('/login');
        return;
      }
      setCurrentJury(jury);

      // Загружаем команды с сервера
      try {
        const savedTeams = await storageUtils.getTeams();
        setTeams(savedTeams);
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    };

    loadData();
  }, [router]);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState("");

  const addTeam = async () => {
    if (newTeamName.trim() && newTeamMembers.trim()) {
      const members = newTeamMembers.split(",").map(m => m.trim()).filter(m => m);
      const newTeam: Team = {
        id: Date.now().toString(),
        name: newTeamName.trim(),
        members,
        totalScore: 0,
      };
      
      try {
        await storageUtils.addTeam(newTeam);
        const updatedTeams = [...teams, newTeam];
        setTeams(updatedTeams);
        setNewTeamName("");
        setNewTeamMembers("");
      } catch (error) {
        console.error('Error adding team:', error);
        alert('Ошибка при добавлении команды');
      }
    }
  };

  const startEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamMembers(team.members.join(", "));
  };

  const saveEditTeam = async () => {
    if (editingTeam && editTeamName.trim() && editTeamMembers.trim()) {
      const members = editTeamMembers.split(",").map(m => m.trim()).filter(m => m);
      const updatedTeam: Team = {
        ...editingTeam,
        name: editTeamName.trim(),
        members,
      };
      
      try {
        await storageUtils.updateTeam(updatedTeam);
        const updatedTeams = teams.map(team =>
          team.id === editingTeam.id ? updatedTeam : team
        );
        setTeams(updatedTeams);
        setEditingTeam(null);
        setEditTeamName("");
        setEditTeamMembers("");
      } catch (error) {
        console.error('Error updating team:', error);
        alert('Ошибка при обновлении команды');
      }
    }
  };

  const cancelEditTeam = () => {
    setEditingTeam(null);
    setEditTeamName("");
    setEditTeamMembers("");
  };

  const deleteTeam = async (id: string) => {
    try {
      await storageUtils.deleteTeam(id);
      const updatedTeams = teams.filter(team => team.id !== id);
      setTeams(updatedTeams);
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Ошибка при удалении команды');
    }
  };

  const handleLogout = () => {
    storageUtils.clearCurrentJury();
    router.push('/login');
  };

  const handleExportBackup = async () => {
    try {
      const data = await storageUtils.exportData();
      setBackupData(data);
      setShowBackupModal(true);
    } catch (error) {
      console.error('Error exporting backup:', error);
      alert('Ошибка при создании резервной копии');
    }
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competition_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    setShowRestoreModal(true);
  };

  const handleRestoreData = async () => {
    try {
      const success = await storageUtils.importData(restoreData);
      if (success) {
        alert('Данные успешно восстановлены!');
        window.location.reload();
      } else {
        alert('Ошибка при восстановлении данных. Проверьте формат файла.');
      }
      setShowRestoreModal(false);
      setRestoreData("");
    } catch (error) {
      console.error('Error restoring data:', error);
      alert('Ошибка при восстановлении данных');
    }
  };

  if (!currentJury) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Панель жюри</h1>
              <p className="text-gray-600 mt-1">Текущий член жюри: {currentJury.name}</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/results" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Результаты
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </header>

        {/* Резервное копирование данных */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">💾 Резервное копирование данных</h2>
          <p className="text-yellow-700 mb-4">
            Для сохранности всех оценок рекомендуется регулярно создавать резервные копии.
            Это защитит данные от случайной потери при очистке браузера или технических сбоях.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleExportBackup}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              📤 Создать резервную копию
            </button>
            <button
              onClick={handleImportBackup}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📥 Восстановить из копии
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Управление командами */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Управление командами</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Добавить команду</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Название команды"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Участники (через запятую)"
                  value={newTeamMembers}
                  onChange={(e) => setNewTeamMembers(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addTeam}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Добавить команду
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Список команд</h3>
              <div className="space-y-3">
                {teams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    {editingTeam?.id === team.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Название команды"
                        />
                        <input
                          type="text"
                          value={editTeamMembers}
                          onChange={(e) => setEditTeamMembers(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Участники (через запятую)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditTeam}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={cancelEditTeam}
                            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{team.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Участники: {team.members.join(", ")}
                          </p>
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            Общий балл: <TeamScoreLoader teamId={team.id} />
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditTeam(team)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => deleteTeam(team.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Навигация по конкурсам */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Оценка конкурсов</h2>
            <div className="space-y-4">
              <Link
                href="/admin/contest/visit-card"
                className="block bg-blue-100 border border-blue-300 rounded-lg p-4 hover:bg-blue-200"
              >
                <h3 className="font-semibold text-blue-800">I конкурс. Визитка</h3>
                <p className="text-sm text-blue-600 mt-1">Максимальный балл: 6</p>
              </Link>

              <Link
                href="/admin/contest/clinical-case"
                className="block bg-green-100 border border-green-300 rounded-lg p-4 hover:bg-green-200"
              >
                <h3 className="font-semibold text-green-800">II конкурс. Клинический случай</h3>
                <p className="text-sm text-green-600 mt-1">Максимальный балл: 4</p>
              </Link>

              <Link
                href="/admin/contest/practical-skills"
                className="block bg-purple-100 border border-purple-300 rounded-lg p-4 hover:bg-purple-200"
              >
                <h3 className="font-semibold text-purple-800">III конкурс. Практические навыки</h3>
                <p className="text-sm text-purple-600 mt-1">Максимальный балл: 48</p>
              </Link>

              <Link
                href="/admin/contest/mind-battle"
                className="block bg-orange-100 border border-orange-300 rounded-lg p-4 hover:bg-orange-200"
              >
                <h3 className="font-semibold text-orange-800">IV конкурс. Битва умов</h3>
                <p className="text-sm text-orange-600 mt-1">Максимальный балл: 2</p>
              </Link>

              <Link
                href="/admin/contest/jury-question"
                className="block bg-red-100 border border-red-300 rounded-lg p-4 hover:bg-red-200 opacity-75"
              >
                <h3 className="font-semibold text-red-800">VI конкурс. Вопрос от жюри</h3>
                <p className="text-xs text-orange-700 font-medium mt-1">⚠️ Только при необходимости</p>
                <p className="text-xs text-gray-600 mt-1">При спорных ситуациях для призовых мест</p>
                <p className="text-sm text-red-600 mt-2">Максимальный балл: 2</p>
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/results"
                className="block w-full bg-gray-800 text-white px-4 py-3 rounded-lg text-center hover:bg-gray-900"
              >
                Посмотреть результаты
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно экспорта */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-semibold mb-4">Резервная копия данных</h3>
            <p className="text-gray-600 mb-4">
              Скопируйте эти данные или скачайте файл для сохранения резервной копии:
            </p>
            <textarea
              value={backupData}
              readOnly
              className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-xs"
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleDownloadBackup}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📥 Скачать файл
              </button>
              <button
                onClick={() => setShowBackupModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно восстановления */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Восстановление данных</h3>
            <p className="text-gray-600 mb-4">
              Вставьте данные из резервной копии для восстановления:
            </p>
            <textarea
              value={restoreData}
              onChange={(e) => setRestoreData(e.target.value)}
              placeholder="Вставьте сюда JSON данные из резервной копии..."
              className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-xs"
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleRestoreData}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={!restoreData.trim()}
              >
                📥 Восстановить
              </button>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreData("");
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}