# Универсальная система олимпиад

Система для проведения медицинских олимпиад и других соревнований с поддержкой множественных мероприятий, гибкими критериями оценки и ролевым доступом.

## Архитектура

### Технологический стек

- **Frontend/Backend**: Next.js 15 (App Router, Server Actions)
- **База данных**: Redis (connection pooling)
- **Валидация**: Zod
- **Стилизация**: Tailwind CSS
- **Деплой**: Vercel

### Ключевые компоненты

#### 1. Инфраструктура (`src/lib/`)

- **redis.ts**: Connection pool с exponential backoff и graceful shutdown
- **dal.ts**: Data Access Layer с role-based авторизацией
- **validation.ts**: Zod схемы для валидации входных данных
- **proxy.ts**: Защита маршрутов (замена middleware в Next.js 16)

#### 2. Сервисный слой (`src/services/`)

- **eventService.ts**: Управление мероприятиями (CRUD, статусы)
- **contestService.ts**: Управление конкурсами (вложенные станции, критерии)
- **teamService.ts**: Управление командами
- **participantService.ts**: Управление участниками (импорт из CSV)
- **juryService.ts**: Управление жюри (назначения, деактивация)
- **scoreService.ts**: Система оценивания (валидация, аудит, агрегация)
- **dashboardService.ts**: Метрики для дашборда
- **resultsService.ts**: Ранжирование и результаты

#### 3. Server Actions (`src/actions/`)

- Авторизация через DAL
- Валидация через Zod
- Кэш-инвалидация через `revalidateTag()`

#### 4. UI компоненты (`src/app/`)

- **admin/page.tsx**: Дашборд администратора
- **results/page.tsx**: Страница результатов

## Модель данных

### Иерархия

```
Event (Мероприятие)
├── Contest (Конкурс)
│   ├── Criteria (Критерии оценки)
│   └── Contest (Вложенные станции)
├── Team (Команда)
│   └── Participant (Участники команды)
├── Participant (Индивидуальные участники)
├── JuryAssignment (Назначения жюри)
└── Score (Оценки)
```

### Типы критериев

1. **numeric**: Числовая оценка с min/max границами
2. **boolean**: Да/Нет (зачёт/незачёт)
3. **dropdown**: Выбор из списка опций

### Роли пользователей

- **Admin**: Полный доступ ко всем мероприятиям
- **Event_Manager**: Управление конкретным мероприятием
- **Jury**: Выставление оценок на назначенных конкурсах

## Основные функции

### 1. Управление мероприятиями

- Создание/редактирование/удаление мероприятий
- Статусы: draft → active → completed → archived
- Нельзя изменять структуру активного мероприятия

### 2. Гибкие критерии оценки

- Настраиваемые критерии для каждого конкурса
- Веса критериев
- Автоматический расчёт maxScore
- Бонусы и штрафы

### 3. Система оценивания

- Валидация границ оценок
- История изменений (аудит-лог)
- Агрегация по жюри (среднее)
- Проверка назначения жюри на конкурс

### 4. Результаты

- Ранжирование участников
- Breakdown по конкурсам и жюри
- Tiebreaker при равных баллах
- Экспорт в PDF/Excel

## Установка и запуск

### Требования

- Node.js 18+
- Redis
- npm или yarn

### Установка

```bash
npm install
```

### Переменные окружения

Создайте `.env.local`:

```env
REDIS_URL=redis://localhost:6379
```

### Запуск в dev режиме

```bash
npm run dev
```

### Сборка для production

```bash
npm run build
npm start
```

## Деплой на Vercel

### Шаг 1: Подготовка Redis

Система требует Redis для хранения данных. Рекомендуем использовать **Upstash Redis** (бесплатный tier доступен):

1. Зарегистрируйтесь на [upstash.com](https://upstash.com/)
2. Создайте новую Redis базу данных
3. Скопируйте `UPSTASH_REDIS_REST_URL` (или стандартный `redis://` URL)

### Шаг 2: Подключение к Vercel

1. Перейдите на [vercel.com](https://vercel.com/) и войдите через GitHub
2. Нажмите "Add New Project"
3. Импортируйте репозиторий `rvzsar/medical-competition`
4. Vercel автоматически определит Next.js проект

### Шаг 3: Настройка переменных окружения

В настройках проекта (Settings → Environment Variables) добавьте:

| Переменная | Описание | Пример |
|------------|----------|--------|
| `REDIS_URL` | URL подключения к Redis | `redis://default:xxx@xxx.upstash.io:6379` |
| `SESSION_SECRET` | Секрет для шифрования сессий (мин. 32 символа) | Сгенерируйте: `openssl rand -base64 32` |
| `CSRF_SECRET` | Секрет для CSRF токенов (мин. 32 символа) | Сгенерируйте: `openssl rand -base64 32` |
| `USER_CREDENTIALS` | Учётные данные пользователей | `admin:SecurePass123:Admin,manager:Pass456:Event_Manager` |
| `JURY_ACCESS_PIN` | PIN для входа жюри | `OLYMPIAD2026` |

**Опционально (для email уведомлений):**

| Переменная | Описание |
|------------|----------|
| `EMAIL_USER` | Gmail адрес |
| `EMAIL_PASS` | App Password от Gmail |
| `EMAIL_FROM` | Имя отправителя |

### Шаг 4: Деплой

1. Нажмите "Deploy"
2. Дождитесь завершения сборки (~2-3 минуты)
3. Получите URL вашего приложения (например, `your-app.vercel.app`)

### Шаг 5: Первый вход

1. Перейдите на `https://your-app.vercel.app/login`
2. Войдите с учётными данными из `USER_CREDENTIALS`
3. Создайте первое мероприятие в админ-панели

### Настройка домена (опционально)

1. В Vercel: Settings → Domains
2. Добавьте свой домен
3. Настройте DNS записи согласно инструкции Vercel

### Мониторинг

- **Логи**: Vercel Dashboard → Deployments → Logs
- **Аналитика**: Vercel Dashboard → Analytics
- **Redis**: Upstash Console → Data Browser

### Troubleshooting

**Ошибка "Redis connection failed":**
- Проверьте правильность `REDIS_URL`
- Убедитесь что Redis доступен из Vercel (whitelist IP если нужно)

**Ошибка "CSRF token invalid":**
- Убедитесь что `CSRF_SECRET` установлен
- Очистите cookies браузера

**Ошибка "Session expired":**
- Проверьте `SESSION_SECRET`
- Убедитесь что секрет не менялся между деплоями

## Безопасность

### Авторизация

- Все Server Actions проверяют авторизацию через DAL
- Proxy защищает маршруты на уровне middleware
- Session хранится в encrypted cookie

### Валидация

- Все входные данные валидируются через Zod
- Проверка границ оценок
- Проверка назначения жюри на конкурсы

### Аудит

- История изменений оценок
- Деактивация жюри сохраняет оценки
- Каскадное удаление с проверками

## Миграция существующих данных

Для миграции данных из старой системы:

```bash
npm run migrate
```

Скрипт миграции находится в `src/scripts/migrate-to-events.ts`

## API

### Server Actions

Все действия выполняются через Server Actions:

```typescript
import { createEvent } from '@/actions/events';

const result = await createEvent({
  name: 'Медицинская олимпиада 2026',
  description: 'Описание',
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-03'),
});

if (result.success) {
  console.log('Event created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Доступные actions

- **events.ts**: createEvent, updateEvent, deleteEvent, getEvents
- **contests.ts**: createContest, updateContest, deleteContest, reorderContests
- **teams.ts**: createTeam, updateTeam, deleteTeam
- **participants.ts**: createParticipant, updateParticipant, importParticipants
- **jury.ts**: createJuryMember, assignJuryToEvent, deactivateJuryMember
- **scores.ts**: submitScore, updateScore, getAggregatedScore

## Разработка

### Структура проекта

```
src/
├── actions/          # Server Actions
├── app/              # Next.js App Router
├── components/       # React компоненты
├── lib/              # Утилиты (redis, dal, validation)
├── services/         # Бизнес-логика
└── types/            # TypeScript типы
```

### Добавление нового критерия

1. Добавьте тип в `CriteriaType` в `src/types/index.ts`
2. Обновите валидацию в `src/lib/validation.ts`
3. Обновите `validateCriteriaValue()` в `src/lib/validation.ts`
4. Обновите `calculateTotalScore()` в `src/services/scoreService.ts`

### Тестирование

```bash
npm test
```

Property-based тесты используют fast-check с минимум 100 итераций.

## Лицензия

MIT

## Поддержка

Для вопросов и предложений создавайте issue в репозитории.
