# Развертывание проекта на Vercel

## Предварительные требования

1. Аккаунт на [Vercel](https://vercel.com)
2. GitHub репозиторий с проектом
3. Настроенное окружение для разработки

## Шаги развертывания

### 1. Подготовка репозитория

```bash
# Инициализация Git (если еще не сделано)
git init
git add .
git commit -m "Initial commit: Medical Competition Evaluation System"

# Добавление удаленного репозитория
git remote add origin https://github.com/yourusername/medical-competition.git
git push -u origin main
```

### 2. Развертывание через Vercel Dashboard

1. Войдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите "New Project"
3. Импортируйте репозиторий проекта
4. Vercel автоматически определит настройки Next.js
5. Нажмите "Deploy"

### 3. Развертывание через Vercel CLI

```bash
# Установка Vercel CLI
npm i -g vercel

# Авторизация
vercel login

# Развертывание
cd medical-competition
vercel --prod
```

## Структура проекта после развертывания

```
medical-competition/
├── .next/                 # Сборка Next.js
├── src/
│   ├── app/
│   │   ├── admin/         # Админ-панель жюри
│   │   ├── contests/      # Страницы конкурсов
│   │   ├── api/           # API routes
│   │   ├── login/         # Страница входа
│   │   └── results/       # Страница результатов
│   ├── components/        # React компоненты
│   ├── utils/            # Утилиты
│   └── types/            # TypeScript типы
├── public/               # Статические файлы
├── tests/               # Тесты
├── package.json
├── next.config.js
└── vercel.json          # Конфигурация Vercel
```

## Настройка переменных окружения

Проект не требует обязательных переменных окружения для базовой работы, но вы можете добавить:

```bash
# Опционально: дополнительные настройки
NEXT_PUBLIC_APP_NAME="Medical Competition System"
NEXT_PUBLIC_VERSION="1.0.0"
```

## Проверка развертывания

После развертывания проверьте:

1. **Главная страница**: `https://your-app.vercel.app/`
2. **Страница входа жюри**: `https://your-app.vercel.app/login`
3. **Админ-панель**: `https://your-app.vercel.app/admin`
4. **Результаты**: `https://your-app.vercel.app/results`

## Тестирование после развертывания

### Проверка API endpoints:

```bash
# Проверка health check
curl https://your-app.vercel.app/api/data

# Проверка добавления команды
curl -X POST https://your-app.vercel.app/api/data \
  -H "Content-Type: application/json" \
  -d '{"type":"addTeam","data":{"name":"Test Team","members":["Member 1","Member 2"]}}'
```

### Проверка функциональности:

1. Вход в систему под разными членами жюри
2. Создание и редактирование команд
3. Оценка конкурсов
4. Проверка агрегирования результатов
5. Проверка сохранения данных между сессиями

## Мониторинг

Vercel предоставляет:

- **Analytics**: Статистика посещений
- **Logs**: Логи выполнения
- **Speed Insights**: Анализ производительности
- **Error Tracking**: Отслеживание ошибок

## Обновление проекта

Для обновления проекта:

```bash
# Внесите изменения
git add .
git commit -m "Update description"
git push origin main

# Vercel автоматически развернет обновление
```

## Резервное копирование

Данные хранятся в памяти сервера Vercel. Для сохранения данных:

1. Используйте встроенную функцию экспорта в админ-панели
2. Регулярно сохраняйте JSON файлы с данными
3. Рассмотрите интеграцию с внешней базой данных для продакшена

## Требования к браузеру

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Поддержка

При возникновении проблем:

1. Проверьте логи в Vercel Dashboard
2. Убедитесь, что все团队成员 используют поддерживаемые браузеры
3. Проверьте сетевое подключение
4. Очистите кэш браузера

---

Проект готов к использованию после развертывания. Все функции протестированы и готовы к работе.