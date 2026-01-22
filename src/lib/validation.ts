/**
 * Схемы валидации с использованием Zod
 * 
 * Requirements: 5.1, 5.6
 */

import { z } from 'zod';

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const EventStatusSchema = z.enum(['draft', 'active', 'completed', 'archived']);

export const CreateEventSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'Дата окончания должна быть позже даты начала',
    path: ['endDate'],
  }
);

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: EventStatusSchema.optional(),
});

// ============================================================================
// CRITERIA SCHEMAS
// ============================================================================

export const CriteriaTypeSchema = z.enum(['numeric', 'boolean', 'dropdown']);

export const CriteriaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: CriteriaTypeSchema,
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  options: z.array(z.string()).optional(),
  weight: z.number().positive().default(1),
  description: z.string().max(500).optional(),
}).refine(
  (data) => {
    // Для numeric обязательны minValue и maxValue
    if (data.type === 'numeric') {
      return data.minValue !== undefined && data.maxValue !== undefined;
    }
    return true;
  },
  {
    message: 'Для numeric критерия обязательны minValue и maxValue',
  }
).refine(
  (data) => {
    // Для dropdown обязателен массив options
    if (data.type === 'dropdown') {
      return data.options && data.options.length > 0;
    }
    return true;
  },
  {
    message: 'Для dropdown критерия обязателен массив options',
  }
).refine(
  (data) => {
    // minValue должен быть меньше maxValue
    if (data.minValue !== undefined && data.maxValue !== undefined) {
      return data.minValue < data.maxValue;
    }
    return true;
  },
  {
    message: 'minValue должен быть меньше maxValue',
  }
);

// ============================================================================
// CONTEST SCHEMAS
// ============================================================================

export const CreateContestSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().nonnegative(),
  parentContestId: z.string().uuid().optional(),
  criteria: z.array(CriteriaSchema).min(1, 'Необходим хотя бы один критерий'),
  timeLimit: z.number().int().positive().optional(),
});

export const UpdateContestSchema = CreateContestSchema.partial().extend({
  id: z.string().uuid(),
});

export const ReorderContestsSchema = z.object({
  eventId: z.string().uuid(),
  contestOrders: z.array(
    z.object({
      contestId: z.string().uuid(),
      order: z.number().int().nonnegative(),
    })
  ),
});

// ============================================================================
// TEAM SCHEMAS
// ============================================================================

export const CreateTeamSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(200),
  institution: z.string().max(200).optional(),
  members: z.array(z.string().min(1)).min(1, 'Необходим хотя бы один участник'),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
});

export const UpdateTeamSchema = CreateTeamSchema.partial().extend({
  id: z.string().uuid(),
});

// ============================================================================
// PARTICIPANT SCHEMAS
// ============================================================================

export const CreateParticipantSchema = z.object({
  eventId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  course: z.string().max(50).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  teamId: z.string().uuid().optional(),
});

export const UpdateParticipantSchema = CreateParticipantSchema.partial().extend({
  id: z.string().uuid(),
});

// ============================================================================
// JURY SCHEMAS
// ============================================================================

export const CreateJuryMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  institution: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
});

export const UpdateJuryMemberSchema = CreateJuryMemberSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const AssignJurySchema = z.object({
  juryId: z.string().uuid(),
  eventId: z.string().uuid(),
  contestIds: z.array(z.string().uuid()).min(1, 'Необходим хотя бы один конкурс'),
});

// ============================================================================
// SCORE SCHEMAS
// ============================================================================

/**
 * Валидация значения критерия в зависимости от типа
 */
export const validateCriteriaValue = (
  value: number | boolean | string,
  criteria: {
    type: 'numeric' | 'boolean' | 'dropdown';
    minValue?: number;
    maxValue?: number;
    options?: string[];
  }
): boolean => {
  switch (criteria.type) {
    case 'numeric':
      if (typeof value !== 'number') return false;
      if (criteria.minValue !== undefined && value < criteria.minValue) return false;
      if (criteria.maxValue !== undefined && value > criteria.maxValue) return false;
      return true;

    case 'boolean':
      return typeof value === 'boolean';

    case 'dropdown':
      if (typeof value !== 'string') return false;
      return criteria.options?.includes(value) ?? false;

    default:
      return false;
  }
};

export const SubmitScoreSchema = z.object({
  eventId: z.string().uuid(),
  contestId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  juryId: z.string().uuid(),
  criteriaScores: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])),
  bonusPoints: z.number().nonnegative().optional(),
  penaltyPoints: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    // Должен быть указан либо teamId, либо participantId
    return !!(data.teamId || data.participantId);
  },
  {
    message: 'Необходимо указать teamId или participantId',
  }
).refine(
  (data) => {
    // Не должны быть указаны оба
    return !(data.teamId && data.participantId);
  },
  {
    message: 'Нельзя указывать одновременно teamId и participantId',
  }
);

export const UpdateScoreSchema = SubmitScoreSchema.partial().extend({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500).optional(), // причина изменения
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserRoleSchema = z.enum(['Admin', 'Event_Manager', 'Jury']);

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  role: UserRoleSchema,
  eventId: z.string().uuid().optional(),
  juryId: z.string().uuid().optional(),
}).refine(
  (data) => {
    // Event_Manager и Jury должны иметь eventId
    if (data.role === 'Event_Manager' || data.role === 'Jury') {
      return !!data.eventId;
    }
    return true;
  },
  {
    message: 'Event_Manager и Jury должны быть привязаны к мероприятию',
    path: ['eventId'],
  }
).refine(
  (data) => {
    // Jury должен иметь juryId
    if (data.role === 'Jury') {
      return !!data.juryId;
    }
    return true;
  },
  {
    message: 'Jury должен быть связан с JuryMember',
    path: ['juryId'],
  }
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type CreateContestInput = z.infer<typeof CreateContestSchema>;
export type UpdateContestInput = z.infer<typeof UpdateContestSchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;
export type CreateParticipantInput = z.infer<typeof CreateParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof UpdateParticipantSchema>;
export type CreateJuryMemberInput = z.infer<typeof CreateJuryMemberSchema>;
export type UpdateJuryMemberInput = z.infer<typeof UpdateJuryMemberSchema>;
export type AssignJuryInput = z.infer<typeof AssignJurySchema>;
export type SubmitScoreInput = z.infer<typeof SubmitScoreSchema>;
export type UpdateScoreInput = z.infer<typeof UpdateScoreSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
