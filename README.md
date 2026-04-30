
# Универсальная система олимпиад / Universal Olympic System

<div align="center">
  <a href="#русский">🇷🇺 Русский</a>   |  
  <a href="#english">🇬🇧 English</a>
</div>

---

## Русский

Система для проведения медицинских олимпиад и других соревнований с поддержкой множественных мероприятий, гибкими критериями оценки и ролевым доступом.

### Архитектура

#### Технологический стек

- **Frontend/Backend**: Next.js 15 (App Router, Server Actions)
- **База данных**: Redis (connection pooling)
- **Валидация**: Zod
- **Стилизация**: Tailwind CSS
- **Деплой**: Vercel

#### Ключевые компоненты

##### 1. Инфраструктура (`src/lib/`)

- **redis.ts**: Connection pool с exponential backoff и graceful shutdown
- **dal.ts**: Data Access Layer с role-based авторизацией
- **validation.ts**: Zod схемы для валидации входных данных
- **proxy.ts**: Защита маршрутов (замена middleware в Next.js 16)

##### 2. Сервисный слой (`src/services/`)

- **eventService.ts**: Управление мероприятиями (CRUD, статусы)
- **contestService.ts**: Управление конкурсами (вложенные станции, критерии)
- **teamService.ts**: Управление командами
- **participantService.ts**: Управление участниками (импорт из CSV)
- **juryService.ts**: Управление жюри (назначения, деактивация)
- **scoreService.ts**: Система оценивания (валидация, аудит, агрегация)
- **dashboardService.ts**: Метрики для дашборда
- **resultsService.ts**: Ранжирование и результаты

##### 3. Server Actions (`src/actions/`)

- Авторизация через DAL
- Валидация через Zod
- Кэш-инвалидация через `revalidateTag()`

##### 4. UI компоненты (`src/app/`)

- **admin/page.tsx**: Дашборд администратора
- **results/page.tsx**: Страница результатов

### Модель данных

#### Иерархия

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

#### Типы критериев

1. **numeric**: Числовая оценка с min/max границами
2. **boolean**: Да/Нет (зачёт/незачёт)
3. **dropdown**: Выбор из списка опций

#### Роли пользователей

- **Admin**: Полный доступ ко всем мероприятиям
- **Event_Manager**: Управление конкретным мероприятием
- **Jury**: Выставление оценок на назначенных конкурсах

### Основные функции

#### 1. Управление мероприятиями

- Создание/редактирование/удаление мероприятий
- Статусы: draft → active → completed → archived
- Нельзя изменять структуру активного мероприятия

#### 2. Гибкие критерии оценки

- Настраиваемые критерии для каждого конкурса
- Веса критериев
- Автоматический расчёт maxScore
- Бонусы и штрафы

#### 3. Система оценивания

- Валидация границ оценок
- История изменений (аудит-лог)
- Агрегация по жюри (среднее)
- Проверка назначения жюри на конкурс

#### 4. Результаты

- Ранжирование участников
- Breakdown по конкурсам и жюри
- Tiebreaker при равных баллах
- Экспорт в PDF/Excel

### API

#### Server Actions

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

#### Доступные actions

- **events.ts**: createEvent, updateEvent, deleteEvent, getEvents
- **contests.ts**: createContest, updateContest, deleteContest, reorderContests
- **teams.ts**: createTeam, updateTeam, deleteTeam
- **participants.ts**: createParticipant, updateParticipant, importParticipants
- **jury.ts**: createJuryMember, assignJuryToEvent, deactivateJuryMember
- **scores.ts**: submitScore, updateScore, getAggregatedScore

### Разработка

#### Структура проекта

```
src/
├── actions/          # Server Actions
├── app/              # Next.js App Router
├── components/       # React компоненты
├── lib/              # Утилиты (redis, dal, validation)
├── services/         # Бизнес-логика
└── types/            # TypeScript типы
```

#### Добавление нового критерия

1. Добавьте тип в `CriteriaType` в `src/types/index.ts`
2. Обновите валидацию в `src/lib/validation.ts`
3. Обновите `validateCriteriaValue()` в `src/lib/validation.ts`
4. Обновите `calculateTotalScore()` в `src/services/scoreService.ts`

---

## English

System for conducting medical olympiads and other competitions with support for multiple events, flexible scoring criteria, and role-based access.

### Architecture

#### Technology Stack

- **Frontend/Backend**: Next.js 15 (App Router, Server Actions)
- **Database**: Redis (connection pooling)
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

#### Key Components

##### 1. Infrastructure (`src/lib/`)

- **redis.ts**: Connection pool with exponential backoff and graceful shutdown
- **dal.ts**: Data Access Layer with role-based authorization
- **validation.ts**: Zod schemas for input validation
- **proxy.ts**: Route protection (middleware replacement in Next.js 16)

##### 2. Service Layer (`src/services/`)

- **eventService.ts**: Event management (CRUD, statuses)
- **contestService.ts**: Contest management (nested stations, criteria)
- **teamService.ts**: Team management
- **participantService.ts**: Participant management (CSV import)
- **juryService.ts**: Jury management (assignments, deactivation)
- **scoreService.ts**: Scoring system (validation, audit, aggregation)
- **dashboardService.ts**: Dashboard metrics
- **resultsService.ts**: Ranking and results

##### 3. Server Actions (`src/actions/`)

- Authorization via DAL
- Validation via Zod
- Cache invalidation via `revalidateTag()`

##### 4. UI Components (`src/app/`)

- **admin/page.tsx**: Admin dashboard
- **results/page.tsx**: Results page

### Data Model

#### Hierarchy

```
Event
├── Contest
│   ├── Criteria
│   └── Contest (nested stations)
├── Team
│   └── Participant
├── Participant (individual)
├── JuryAssignment
└── Score
```

#### Criteria Types

1. **numeric**: Numeric score with min/max boundaries
2. **boolean**: Yes/No (pass/fail)
3. **dropdown**: Selection from a list of options

#### User Roles

- **Admin**: Full access to all events
- **Event_Manager**: Manage a specific event
- **Jury**: Submit scores for assigned contests

### Core Features

#### 1. Event Management

- Create/edit/delete events
- Statuses: draft → active → completed → archived
- Cannot modify structure of an active event

#### 2. Flexible Scoring Criteria

- Customizable criteria per contest
- Criterion weights
- Automatic maxScore calculation
- Bonuses and penalties

#### 3. Scoring System

- Score boundary validation
- Change history (audit log)
- Jury aggregation (average)
- Jury assignment validation per contest

#### 4. Results

- Participant ranking
- Breakdown by contest and jury
- Tiebreaker for equal scores
- Export to PDF/Excel

### API

#### Server Actions

All actions are performed via Server Actions:

```typescript
import { createEvent } from '@/actions/events';

const result = await createEvent({
  name: 'Medical Olympiad 2026',
  description: 'Description',
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-03'),
});

if (result.success) {
  console.log('Event created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

#### Available Actions

- **events.ts**: createEvent, updateEvent, deleteEvent, getEvents
- **contests.ts**: createContest, updateContest, deleteContest, reorderContests
- **teams.ts**: createTeam, updateTeam, deleteTeam
- **participants.ts**: createParticipant, updateParticipant, importParticipants
- **jury.ts**: createJuryMember, assignJuryToEvent, deactivateJuryMember
- **scores.ts**: submitScore, updateScore, getAggregatedScore

### Development

#### Project Structure

```
src/
├── actions/          # Server Actions
├── app/              # Next.js App Router
├── components/       # React components
├── lib/              # Utilities (redis, dal, validation)
├── services/         # Business logic
└── types/            # TypeScript types
```

#### Adding a New Criterion Type

1. Add the type to `CriteriaType` in `src/types/index.ts`
2. Update validation in `src/lib/validation.ts`
3. Update `validateCriteriaValue()` in `src/lib/validation.ts`
4. Update `calculateTotalScore()` in `src/services/scoreService.ts`

