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

1. Подключите репозиторий к Vercel
2. Добавьте Redis через Vercel Storage или внешний сервис
3. Установите переменную окружения `REDIS_URL`
4. Деплой произойдёт автоматически

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
