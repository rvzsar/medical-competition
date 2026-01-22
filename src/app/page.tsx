/**
 * Home Page - главная страница
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Универсальная система олимпиад
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Современная платформа для проведения медицинских олимпиад и других
            соревнований с гибкими критериями оценки
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-blue-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Гибкие критерии
            </h3>
            <p className="text-gray-600">
              Настраиваемые критерии оценки для каждого конкурса: числовые,
              boolean, dropdown
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-blue-600 text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Управление жюри
            </h3>
            <p className="text-gray-600">
              Назначение жюри на конкурсы, история изменений оценок, агрегация
              по жюри
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-blue-600 text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Результаты
            </h3>
            <p className="text-gray-600">
              Автоматическое ранжирование, breakdown по конкурсам, экспорт в
              PDF/Excel
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href="/admin"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
          >
            Панель управления
          </Link>
          <Link
            href="/results"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium text-lg"
          >
            Результаты
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-lg"
          >
            Вход
          </Link>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Возможности системы
          </h2>
          <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Множественные мероприятия с разными конфигурациями
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Вложенные конкурсы (станции)
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Командные и индивидуальные участники
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Импорт участников из CSV
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Role-based доступ (Admin, Event Manager, Jury)
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Валидация границ оценок
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Аудит изменений оценок
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Tiebreaker при равных баллах
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>
            Построено на Next.js 15, Redis, TypeScript
          </p>
        </div>
      </div>
    </div>
  );
}
