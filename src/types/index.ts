export interface Team {
  id: string;
  name: string;
  members: string[];
  totalScore: number;
}

export interface Contest {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  timeLimit?: number;
}

export interface JuryMember {
  id: string;
  name: string;
  title: string;
  isActive: boolean;
}

export interface TeamScore {
  teamId: string;
  contestId: string;
  juryId: string;
  score: number;
  details?: unknown;
  completedAt?: Date;
}

export interface AggregatedScore {
  teamId: string;
  contestId: string;
  averageScore: number;
  juryScores: {
    juryId: string;
    juryName: string;
    score: number;
  }[];
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