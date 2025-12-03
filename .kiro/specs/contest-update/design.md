# Design Document

## Overview

Обновление системы оценки олимпиады по акушерству и гинекологии. Изменения включают:
- Обновление структуры конкурсов и критериев оценки
- Добавление функционала жеребьевки
- Обновление расчета итоговых баллов

## Architecture

```mermaid
graph TB
    subgraph Frontend
        A[Страница конкурсов] --> B[Форма оценки]
        C[Страница жеребьевки] --> D[Результаты жеребьевки]
        E[Таблица результатов]
    end
    
    subgraph API
        F[/api/data] --> G[Redis Storage]
        H[/api/lottery] --> G
    end
    
    B --> F
    D --> H
    E --> F
```

## Components and Interfaces

### 1. Конфигурация конкурсов

```typescript
interface Contest {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  timeLimit: string;
  criteria: CriteriaItem[];
  hasBonus?: boolean;
  hasPenalty?: boolean;
}

interface CriteriaItem {
  id: string;
  name: string;
  maxScore: number;
  options?: { value: number; label: string }[];
}

interface Station {
  id: string;
  name: string;
  contestId: string;
  maxScore: number;
  criteria: CriteriaItem[];
}
```

### 2. Жеребьевка

```typescript
interface LotteryResult {
  id: string;
  type: 'suture-order' | 'mind-battle-pairs';
  timestamp: Date;
  results: LotteryItem[];
}

interface LotteryItem {
  teamId: string;
  teamName: string;
  result: string | string[]; // вид шва или ID соперника
}
```

### 3. Оценка

```typescript
interface ContestScore {
  teamId: string;
  contestId: string;
  stationId?: string;
  juryId: string;
  criteria: { [criteriaId: string]: number };
  bonus?: number;
  penalty?: number;
  totalScore: number;
  timestamp: Date;
}
```

## Data Models

### Конкурсы (обновленная конфигурация)

```typescript
const CONTESTS = [
  {
    id: 'visit-card',
    name: 'I конкурс. Визитка',
    maxScore: 6,
    timeLimit: '3 минуты',
    hasPenalty: true,
    criteria: [
      { id: 'integrity', name: 'Целостность выступления', maxScore: 2 },
      { id: 'culture', name: 'Культура и сплоченность', maxScore: 1 },
      { id: 'creativity', name: 'Творчество и артистизм', maxScore: 2 },
      { id: 'originality', name: 'Оригинальность', maxScore: 1 },
    ]
  },
  {
    id: 'clinical-case',
    name: 'II конкурс. Клинический случай',
    maxScore: 4,
    timeLimit: '10 минут',
    hasBonus: true,
    criteria: [
      { id: 'answer', name: 'Качество ответа', maxScore: 3, 
        options: [
          { value: 3, label: 'Полный правильный ответ' },
          { value: 2, label: 'С неточностями' },
          { value: 1, label: 'Частичный ответ' },
          { value: 0, label: 'Неверный ответ' }
        ]
      }
    ]
  },
  // ... остальные конкурсы
];

const PRACTICAL_STATIONS = [
  {
    id: 'sutures',
    name: 'Швы при кесаревом сечении',
    maxScore: 12,
    criteria: [
      { id: 'aesthetics', name: 'Эстетичность', maxScore: 3 },
      { id: 'adaptation', name: 'Адаптация краев раны', maxScore: 4 },
      { id: 'instruments', name: 'Работа с инструментами', maxScore: 3 },
      { id: 'time', name: 'Время выполнения', maxScore: 2 }
    ]
  },
  {
    id: 'outpatient',
    name: 'Амбулаторный прием',
    maxScore: 12,
    criteria: [
      { id: 'professionalism', name: 'Профессионализм и подготовка', maxScore: 3 },
      { id: 'technique', name: 'Техника и коммуникация', maxScore: 5 },
      { id: 'completion', name: 'Завершение приема', maxScore: 4 }
    ]
  },
  {
    id: 'obstetric',
    name: 'Акушерское пособие в родах',
    maxScore: 12,
    criteria: [
      { id: 'moments', name: 'Правильность моментов', maxScore: 5 },
      { id: 'safety', name: 'Безопасность', maxScore: 3 },
      { id: 'time', name: 'Время выполнения', maxScore: 2 },
      { id: 'teamwork', name: 'Слаженность бригады', maxScore: 2 }
    ]
  },
  {
    id: 'laparoscopy',
    name: 'Лапароскопический симулятор',
    maxScore: 12,
    criteria: [
      { id: 'accuracy', name: 'Точность транслокации', maxScore: 6 },
      { id: 'trajectory', name: 'Траектория движения', maxScore: 6 }
    ]
  }
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Визитка - итоговый балл не превышает максимум
*For any* набор оценок по критериям визитки и любое количество штрафных минут, итоговый балл должен быть в диапазоне [0, 6] и равен сумме критериев минус штрафы (но не меньше 0).
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Клинический случай - корректный расчет с бонусом
*For any* оценка клинического случая (0-3) и флаг досрочного ответа, итоговый балл должен быть в диапазоне [0, 4] и равен оценке + 1 если досрочно.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Практические навыки - сумма критериев равна максимуму станции
*For any* станция практических навыков, сумма максимальных баллов всех критериев должна равняться maxScore станции (12 баллов).
**Validates: Requirements 3.1-3.6, 4.1-4.2, 5.1-5.2, 6.1-6.3**

### Property 4: Жеребьевка швов - валидный результат
*For any* команда, результат жеребьевки швов должен быть одним из: 'donati', 'multanovsky', 'intradermal'.
**Validates: Requirements 8.1**

### Property 5: Жеребьевка "Битвы умов" - корректные пары
*For any* набор команд, жеребьевка должна создать пары где каждая команда имеет ровно одного соперника и ни одна команда не играет сама с собой.
**Validates: Requirements 8.2**

### Property 6: Итоговый балл - корректная сумма
*For any* команда с оценками по всем конкурсам, итоговый балл должен равняться сумме: Визитка + Клинический случай + 4 станции практических навыков + Битва умов, и не превышать 60 баллов.
**Validates: Requirements 9.1, 9.2**

## Error Handling

- Валидация оценок: каждый критерий должен быть в допустимом диапазоне
- Проверка авторизации жюри перед сохранением оценок
- Обработка конфликтов при одновременном редактировании
- Логирование всех изменений оценок

## Testing Strategy

### Unit Tests
- Тесты расчета итоговых баллов для каждого конкурса
- Тесты валидации оценок
- Тесты логики жеребьевки

### Property-Based Tests (fast-check)
- Property 1-6 реализуются как property-based тесты
- Минимум 100 итераций для каждого теста
- Формат комментария: `**Feature: contest-update, Property N: описание**`
