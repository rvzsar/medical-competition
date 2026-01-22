/**
 * Login Page - страница входа
 * 
 * Requirements: 9.1, 9.2
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, getCSRFToken } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [csrfToken, setCsrfToken] = useState('');

  // Генерировать CSRF токен при монтировании
  useEffect(() => {
    getCSRFToken().then(setCsrfToken);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setError(null);

    startTransition(async () => {
      const result = await login(username, password, csrfToken);

      if (result.success) {
        // Редирект в зависимости от роли
        if (result.role === 'Jury') {
          router.push('/contests');
        } else {
          router.push('/admin');
        }
      } else {
        setError(result.error || 'Ошибка входа');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Вход в систему
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Форма входа">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
              disabled={isPending}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            aria-busy={isPending}
          >
            {isPending ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Демо-доступ (только для разработки):</p>
            <div className="mt-2 space-y-1">
              <p>
                <strong>Admin:</strong> admin / admin123
              </p>
              <p>
                <strong>Менеджер:</strong> manager / manager123
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
