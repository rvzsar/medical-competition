/**
 * Конфигурация конкурсов олимпиады по акушерству и гинекологии
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
 */

// Интерфейсы
export interface CriteriaOption {
  value: number;
  label: string;
}

export interface CriteriaItem {
  id: string;
  name: string;
  maxScore: number;
  options?: CriteriaOption[];
}

export interface Contest {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  timeLimit: string;
  criteria: CriteriaItem[];
  hasBonus?: boolean;
  hasPenalty?: boolean;
}

export interface Station {
  id: string;
  name: string;
  contestId: string;
  maxScore: number;
  criteria: CriteriaItem[];
  hasPenalty?: boolean;
}

// Конкурсы
export const CONTESTS: Contest[] = [
  {
    id: 'visit-card',
    name: 'I конкурс. Визитка',
    description: 'Представление команды',
    maxScore: 6,
    timeLimit: '3 минуты',
    hasPenalty: true,
    criteria: [
      { id: 'integrity', name: 'Целостность выступления', maxScore: 2 },
      { id: 'culture', name: 'Культура и сплоченность', maxScore: 1 },
      { id: 'creativity', name: 'Творчество и артистизм', maxScore: 2 },
      { id: 'originality', name: 'Оригинальность', maxScore: 1 },
    ],
  },
  {
    id: 'clinical-case',
    name: 'II конкурс. Клинический случай',
    description: 'Решение ситуационной задачи',
    maxScore: 4,
    timeLimit: '10 минут',
    hasBonus: true,
    criteria: [
      {
        id: 'answer',
        name: 'Качество ответа',
        maxScore: 3,
        options: [
          { value: 3, label: 'Полный правильный ответ' },
          { value: 2, label: 'С неточностями' },
          { value: 1, label: 'Частичный ответ' },
          { value: 0, label: 'Неверный ответ' },
        ],
      },
    ],
  },
  {
    id: 'practical-skills',
    name: 'III конкурс. Практические навыки',
    description: '4 станции практических навыков',
    maxScore: 48,
    timeLimit: 'Зависит от станции',
    criteria: [],
  },
  {
    id: 'mind-battle',
    name: 'V конкурс. Битва умов',
    description: 'Ответы на вопросы в парах команд',
    maxScore: 2,
    timeLimit: '1 минута на ответ',
    criteria: [
      {
        id: 'answer',
        name: 'Качество ответа',
        maxScore: 2,
        options: [
          { value: 2, label: 'Верный полный ответ' },
          { value: 1, label: 'С неточностями' },
          { value: 0, label: 'Неверный ответ' },
        ],
      },
    ],
  },
  {
    id: 'jury-question',
    name: 'VI конкурс. Вопрос от жюри',
    description: 'Дополнительный конкурс для спорных ситуаций',
    maxScore: 2,
    timeLimit: '1 минута',
    criteria: [
      {
        id: 'answer',
        name: 'Качество ответа',
        maxScore: 2,
        options: [
          { value: 2, label: 'Верный полный ответ' },
          { value: 1, label: 'С неточностями' },
          { value: 0, label: 'Неверный ответ' },
        ],
      },
    ],
  },
];


// Станции практических навыков
export const PRACTICAL_STATIONS: Station[] = [
  {
    id: 'sutures',
    name: 'Швы при кесаревом сечении',
    contestId: 'practical-skills',
    maxScore: 12,
    criteria: [
      {
        id: 'aesthetics',
        name: 'Эстетичность',
        maxScore: 3,
        options: [
          { value: 3, label: 'Отлично' },
          { value: 2, label: 'Хорошо' },
          { value: 1, label: 'Удовлетворительно' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'adaptation',
        name: 'Адаптация краев раны во всех 3 видах шва',
        maxScore: 4,
        options: [
          { value: 4, label: 'Отлично во всех швах' },
          { value: 3, label: 'Хорошо' },
          { value: 2, label: 'Удовлетворительно' },
          { value: 1, label: 'Частично' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'instruments',
        name: 'Работа с инструментами',
        maxScore: 3,
        options: [
          { value: 3, label: 'Отлично' },
          { value: 2, label: 'Хорошо' },
          { value: 1, label: 'Удовлетворительно' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'time',
        name: 'Время выполнения',
        maxScore: 2,
        options: [
          { value: 2, label: 'До 7 минут' },
          { value: 1, label: '7-10 минут' },
          { value: 0, label: 'Более 10 минут' },
        ],
      },
    ],
  },
  {
    id: 'outpatient',
    name: 'Амбулаторный прием',
    contestId: 'practical-skills',
    maxScore: 12,
    criteria: [
      {
        id: 'professionalism',
        name: 'Профессионализм и подготовка',
        maxScore: 3,
        options: [
          { value: 3, label: 'Отлично' },
          { value: 2, label: 'Хорошо' },
          { value: 1, label: 'Удовлетворительно' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'technique',
        name: 'Техника и коммуникация',
        maxScore: 5,
        options: [
          { value: 5, label: 'Отлично' },
          { value: 4, label: 'Очень хорошо' },
          { value: 3, label: 'Хорошо' },
          { value: 2, label: 'Удовлетворительно' },
          { value: 1, label: 'Частично' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'completion',
        name: 'Завершение приема',
        maxScore: 4,
        options: [
          { value: 4, label: 'Отлично' },
          { value: 3, label: 'Хорошо' },
          { value: 2, label: 'Удовлетворительно' },
          { value: 1, label: 'Частично' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
    ],
  },
  {
    id: 'obstetric',
    name: 'Акушерское пособие в родах',
    contestId: 'practical-skills',
    maxScore: 12,
    criteria: [
      {
        id: 'moments',
        name: 'Правильность моментов',
        maxScore: 5,
        options: [
          { value: 5, label: 'Все моменты выполнены правильно' },
          { value: 4, label: 'Незначительные неточности' },
          { value: 3, label: 'Хорошо' },
          { value: 2, label: 'Удовлетворительно' },
          { value: 1, label: 'Частично' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'safety',
        name: 'Безопасность',
        maxScore: 3,
        options: [
          { value: 3, label: 'Полностью безопасно' },
          { value: 2, label: 'Хорошо' },
          { value: 1, label: 'Удовлетворительно' },
          { value: 0, label: 'Небезопасно' },
        ],
      },
      {
        id: 'time',
        name: 'Время выполнения',
        maxScore: 2,
        options: [
          { value: 2, label: 'В пределах нормы' },
          { value: 1, label: 'Незначительное превышение' },
          { value: 0, label: 'Значительное превышение' },
        ],
      },
      {
        id: 'teamwork',
        name: 'Слаженность бригады',
        maxScore: 2,
        options: [
          { value: 2, label: 'Отличная слаженность' },
          { value: 1, label: 'Удовлетворительно' },
          { value: 0, label: 'Несогласованность' },
        ],
      },
    ],
  },
  {
    id: 'laparoscopy',
    name: 'Лапароскопический симулятор',
    contestId: 'practical-skills',
    maxScore: 12,
    hasPenalty: true,
    criteria: [
      {
        id: 'accuracy',
        name: 'Точность транслокации',
        maxScore: 6,
        options: [
          { value: 6, label: 'Отлично' },
          { value: 5, label: 'Очень хорошо' },
          { value: 4, label: 'Хорошо' },
          { value: 3, label: 'Удовлетворительно' },
          { value: 2, label: 'Частично' },
          { value: 1, label: 'Плохо' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
      {
        id: 'trajectory',
        name: 'Траектория движения',
        maxScore: 6,
        options: [
          { value: 6, label: 'Отлично' },
          { value: 5, label: 'Очень хорошо' },
          { value: 4, label: 'Хорошо' },
          { value: 3, label: 'Удовлетворительно' },
          { value: 2, label: 'Частично' },
          { value: 1, label: 'Плохо' },
          { value: 0, label: 'Неудовлетворительно' },
        ],
      },
    ],
  },
];

// Виды швов для жеребьевки
export const SUTURE_TYPES = ['donati', 'multanovsky', 'intradermal'] as const;
export type SutureType = (typeof SUTURE_TYPES)[number];

export const SUTURE_NAMES: Record<SutureType, string> = {
  donati: 'Донати-Мак-Миллан',
  multanovsky: 'Мультановский-Реверден',
  intradermal: 'Внутрикожный',
};

// Максимальный итоговый балл
export const MAX_TOTAL_SCORE = 60;

// Вспомогательные функции
export function getContestById(id: string): Contest | undefined {
  return CONTESTS.find((c) => c.id === id);
}

export function getStationById(id: string): Station | undefined {
  return PRACTICAL_STATIONS.find((s) => s.id === id);
}

export function calculateStationMaxScore(station: Station): number {
  return station.criteria.reduce((sum, c) => sum + c.maxScore, 0);
}
