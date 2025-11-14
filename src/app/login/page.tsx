"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JuryMember } from "@/types";
import { JURY_MEMBERS } from "@/config/juryMembers";

export default function LoginPage() {
  const router = useRouter();
  const [selectedJury, setSelectedJury] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [accessPin, setAccessPin] = useState<string>("");

  const juryMembers: JuryMember[] = JURY_MEMBERS;

  const handleLogin = async () => {
    if (!selectedJury) {
      setError("Пожалуйста, выберите члена жюри");
      return;
    }

    if (!accessPin.trim()) {
      setError("Введите PIN доступа, который вы получили от организаторов");
      return;
    }

    const jury = juryMembers.find(j => j.id === selectedJury);
    if (!jury) {
      setError("Выбранный член жюри не найден");
      return;
    }

    // Сохраняем информацию о текущем члене жюри в localStorage
    localStorage.setItem('currentJury', JSON.stringify(jury));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ juryId: jury.id, accessPin: accessPin.trim() }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setError(result.error || 'Неверный PIN или ошибка при создании сессии');
        return;
      }

      router.push('/admin');
    } catch (e) {
      console.error('Login error:', e);
      setError('Ошибка входа. Проверьте подключение к сети.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Вход для жюри
          </h1>
          <p className="text-gray-600">
            Олимпиада по акушерству и гинекологии
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите члена жюри
            </label>
            <select
              value={selectedJury}
              onChange={(e) => {
                setSelectedJury(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите из списка...</option>
              {juryMembers.map((jury) => (
                <option key={jury.id} value={jury.id}>
                  {jury.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN доступа для жюри
            </label>
            <input
              type="password"
              value={accessPin}
              onChange={(e) => {
                setAccessPin(e.target.value);
                setError("");
              }}
              placeholder="Введите PIN, выданный организаторами"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedJury && (
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                {juryMembers.find(j => j.id === selectedJury)?.title}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Войти в систему
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Вернуться на главную страницу
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Состав жюри:</h3>
          <ul className="text-xs text-gray-600 space-y-2">
            {juryMembers.map((jury) => (
              <li key={jury.id} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <div>
                  <div className="font-medium">{jury.name}</div>
                  <div className="text-gray-500">{jury.title}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}