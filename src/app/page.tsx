import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            Олимпиада по акушерству и гинекологии
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Система оценки межвузовской студенческой олимпиады по акушерству и гинекологии
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              Общая информация
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Формат проведения:</strong> командный зачет
              </p>
              <p>
                <strong>Призовые места:</strong> 3 команды с наибольшим количеством баллов
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              Навигация
            </h2>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Вход для жюри
              </Link>
              <Link
                href="/results"
                className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Результаты
              </Link>
              <Link
                href="/contests"
                className="block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                Конкурсы
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-6">
            Конкурсы
          </h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-800">
                I конкурс. Визитка
              </h3>
              <p className="text-gray-600 mb-2">
                Устная презентация и/или видеоролик (до 3 минут)
              </p>
              <p className="text-sm text-gray-500">
                Максимальный балл: 6
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-800">
                II конкурс. Клинический случай
              </h3>
              <p className="text-gray-600 mb-2">
                Решение ситуационной задачи (10 минут)
              </p>
              <p className="text-sm text-gray-500">
                Максимальный балл: 4
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-800">
                III конкурс. Практические навыки
              </h3>
              <div className="text-gray-600 mb-2">
                <p>• Швы при кесаревом сечении (до 10 минут)</p>
                <p>• Амбулаторный прием (10 минут)</p>
                <p>• Акушерское пособие в родах (до 5 минут)</p>
                <p>• Лапароскопический симулятор (до 10 минут)</p>
              </div>
              <p className="text-sm text-gray-500">
                Максимальный балл: 48 (по 12 баллов за каждую станцию)
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-800">
                IV конкурс. Битва умов
              </h3>
              <p className="text-gray-600 mb-2">
                Вопросы командам-соперникам по тематикам
              </p>
              <p className="text-sm text-gray-500">
                Максимальный балл: 2
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-xl font-semibold text-gray-800">
                VI конкурс. Вопрос от жюри
              </h3>
              <p className="text-gray-600 mb-2">
                Дополнительные вопросы для команд, претендующих на призовые места
              </p>
              <p className="text-sm text-orange-600 font-medium mb-1">
                ⚠️ Проводится только при необходимости
              </p>
              <p className="text-xs text-gray-500">
                Используется при возникновении спорной ситуации при выборе призового места
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Максимальный балл: 2
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">
            Награждение
          </h2>
          <div className="text-gray-700">
            <h3 className="font-semibold mb-2">Командные награды:</h3>
            <ul className="space-y-1 text-sm">
              <li>• 1 место - освобождение от экзамена с оценкой "отлично"</li>
              <li>• 2, 3 места - +1 балл к экзамену</li>
              <li>• Победитель конкурса "Визитка" - +1 балл к экзамену</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
