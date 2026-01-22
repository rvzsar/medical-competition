// ============================================================================
// НОВАЯ УНИВЕРСАЛЬНАЯ СИСТЕМА
// ============================================================================

/**
 * Статус мероприятия
 */
export type EventStatus = 'draft' | 'active' | 'completed' | 'archived';

/**
 * Мероприятие (Event) - верхний уровень иерархии
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export interface Event {
  id: string;
  name: string;
  description?: string;
  status: EventStatus;
  startDate?: Date;
  endDate?: Date;
  location?: string; // место проведения
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
}

/**
 * Тип критерия оценки
 */
export type CriteriaType = 'numeric' | 'boolean' | 'dropdown';

/**
 * Критерий оценки
 * Requirements: 2.2, 5.1
 */
export interface Criteria {
  id: string;
  name: string;
  type: CriteriaType;
  minValue?: number; // для numeric
  maxValue?: number; // для numeric
  options?: string[]; // для dropdown
  weight?: number; // вес критерия в общей оценке (по умолчанию 1)
  description?: string;
}

/**
 * Конкурс (Contest) - часть мероприятия
 * Requirements: 2.1, 2.3, 2.4, 2.5
 */
export interface Contest {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  order: number; // порядок отображения
  parentContestId?: string; // для вложенных станций
  criteria: Criteria[]; // критерии оценки для этого конкурса
  maxScore?: number; // максимальный балл (вычисляется из критериев)
  timeLimit?: number; // лимит времени в минутах
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Команда
 * Requirements: 3.1, 3.2
 */
export interface Team {
  id: string;
  eventId: string;
  name: string;
  institution?: string; // учебное заведение
  members: string[]; // имена участников
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Участник (для индивидуальных мероприятий)
 * Requirements: 3.1, 3.3
 */
export interface Participant {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  institution?: string;
  course?: string; // курс обучения
  contactEmail?: string;
  contactPhone?: string;
  teamId?: string; // если участник в команде
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Член жюри
 * Requirements: 4.1, 4.4
 */
export interface JuryMember {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  title: string; // должность/звание
  institution?: string;
  contactEmail?: string;
  isActive: boolean; // деактивированные жюри сохраняют оценки
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Назначение жюри на мероприятие и конкурсы
 * Requirements: 4.2, 4.3
 */
export interface JuryAssignment {
  id: string;
  juryId: string;
  eventId: string;
  contestIds: string[]; // список конкурсов к которым назначен
  assignedAt: Date;
  assignedBy: string; // userId
}

/**
 * Оценка от жюри
 * Requirements: 5.1, 5.2, 5.3
 */
export interface Score {
  id: string;
  eventId: string;
  contestId: string;
  teamId?: string; // для командных мероприятий
  participantId?: string; // для индивидуальных мероприятий
  juryId: string;
  criteriaScores: Record<string, number | boolean | string>; // criteriaId -> значение
  totalScore: number; // итоговая оценка с учётом весов
  bonusPoints?: number; // бонусные баллы
  penaltyPoints?: number; // штрафные баллы
  notes?: string; // комментарии жюри
  submittedAt: Date;
  updatedAt?: Date;
  editHistory?: ScoreEdit[]; // история изменений
}

/**
 * История изменения оценки
 * Requirements: 5.2
 */
export interface ScoreEdit {
  editedAt: Date;
  editedBy: string; // juryId
  previousScore: number;
  newScore: number;
  reason?: string;
}

/**
 * Агрегированная оценка (среднее по жюри)
 * Requirements: 5.3, 7.1
 */
export interface AggregatedScore {
  eventId: string;
  contestId: string;
  teamId?: string;
  participantId?: string;
  averageScore: number;
  juryScores: {
    juryId: string;
    juryName: string;
    score: number;
  }[];
  completedAt?: Date;
}

/**
 * Пользователь системы
 * Requirements: 9.1
 */
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'Admin' | 'Event_Manager' | 'Jury';
  eventId?: string; // для Event_Manager и Jury
  juryId?: string; // связь с JuryMember для роли Jury
  createdAt: Date;
  lastLoginAt?: Date;
}

// ============================================================================
// СТАРАЯ СИСТЕМА (для обратной совместимости)
// ============================================================================

/**
 * @deprecated Используйте новый интерфейс Team
 */
export interface LegacyTeam {
  id: string;
  name: string;
  members: string[];
  totalScore: number;
}

/**
 * @deprecated Используйте новый интерфейс Contest
 */
export interface LegacyContest {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  timeLimit?: number;
}

/**
 * @deprecated Используйте новый интерфейс Score
 */
export interface TeamScore {
  teamId: string;
  contestId: string;
  juryId: string;
  score: number;
  details?: unknown;
  completedAt?: Date;
}

// I конкурс - Визитка
export interface VisitCardScore {
  integrity: number; // целостность выступления (2 балла)
  culture: number; // культура выступления (1 балл)
  creativity: number; // творческие способности (2 балла)
  originality: number; // оригинальность (1 балл)
  timePenalty?: number; // штраф за превышение времени
}

// II конкурс - Клинический случай
export interface ClinicalCaseScore {
  correctAnswer: boolean;
  explanation: number; // 3, 2, 1, 0 баллов
  earlyCompletion?: boolean; // +1 балл за досрочное выполнение
}

// III конкурс - Практические навыки
export interface PracticalSkillsScore {
  sutures: SuturesScore;
  ambulatoryReception: AmbulatoryReceptionScore;
  obstetricAid: ObstetricAidScore;
  laparoscopy: LaparoscopyScore;
}

export interface SuturesScore {
  aesthetics: number; // 3, 1, 0
  adaptation: number; // 4, 2, 1, 0
  technique: number; // 3, 1, 0
  time: number; // 2, 1, 0
}

export interface AmbulatoryReceptionScore {
  preparation: number; // макс. 3 балла
  technique: number; // макс. 5 баллов
  completion: number; // макс. 4 балла
}

export interface ObstetricAidScore {
  correctness: number; // 5, 3, 1, 0
  safety: number; // 3, 1, 0
  time: number; // 2, 1, 0
  teamwork: number; // 2, 1, 0
}

export interface LaparoscopyScore {
  translocation: { accuracy: number; trajectory: number };
  coordination: { accuracy: number; trajectory: number };
  targeting: { accuracy: number; trajectory: number };
  parking: { accuracy: number; trajectory: number };
}

// IV конкурс - Битва умов
export interface MindBattleScore {
  correctAnswer: boolean;
  points: number; // 2, 1, 0
}

// VI конкурс - Вопрос от жюри
export interface JuryQuestionScore {
  correctAnswer: boolean;
  points: number; // 2, 1, 0
}