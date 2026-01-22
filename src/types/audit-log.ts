/**
 * Типы для системы аудит-логов
 */

export type AuditAction = 
  // Email
  | 'email_sent'
  | 'email_bulk_sent'
  | 'email_failed'
  // Events
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  // Contests
  | 'contest_created'
  | 'contest_updated'
  | 'contest_deleted'
  // Teams
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  // Participants
  | 'participant_added'
  | 'participant_removed'
  // Jury
  | 'jury_assigned'
  | 'jury_removed'
  // Scores
  | 'score_submitted'
  | 'score_updated'
  // Certificates
  | 'certificate_generated'
  | 'certificate_design_saved'
  // Auth
  | 'user_login'
  | 'user_logout';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  
  // Детали действия
  details: {
    // Для email
    recipientEmail?: string;
    emailSubject?: string;
    recipientCount?: number;
    
    // Для событий/конкурсов
    entityId?: string;
    entityName?: string;
    entityType?: 'event' | 'contest' | 'team' | 'participant' | 'jury';
    
    // Для оценок
    teamId?: string;
    teamName?: string;
    contestId?: string;
    contestName?: string;
    score?: number;
    
    // Общее
    eventId?: string;
    eventName?: string;
    description?: string;
    error?: string;
  };
  
  // IP адрес (для безопасности)
  ipAddress?: string;
}

export interface AuditLogFilter {
  action?: AuditAction | AuditAction[];
  userId?: string;
  eventId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Человекочитаемые названия действий
export const ACTION_LABELS: Record<AuditAction, string> = {
  email_sent: 'Отправлен email',
  email_bulk_sent: 'Массовая рассылка',
  email_failed: 'Ошибка отправки email',
  event_created: 'Создано мероприятие',
  event_updated: 'Обновлено мероприятие',
  event_deleted: 'Удалено мероприятие',
  contest_created: 'Создан конкурс',
  contest_updated: 'Обновлён конкурс',
  contest_deleted: 'Удалён конкурс',
  team_created: 'Создана команда',
  team_updated: 'Обновлена команда',
  team_deleted: 'Удалена команда',
  participant_added: 'Добавлен участник',
  participant_removed: 'Удалён участник',
  jury_assigned: 'Назначен член жюри',
  jury_removed: 'Удалён член жюри',
  score_submitted: 'Выставлена оценка',
  score_updated: 'Обновлена оценка',
  certificate_generated: 'Сгенерирован сертификат',
  certificate_design_saved: 'Сохранён дизайн сертификата',
  user_login: 'Вход в систему',
  user_logout: 'Выход из системы',
};

// Иконки для действий
export const ACTION_ICONS: Record<AuditAction, string> = {
  email_sent: '📧',
  email_bulk_sent: '📬',
  email_failed: '❌',
  event_created: '🎉',
  event_updated: '✏️',
  event_deleted: '🗑️',
  contest_created: '🏆',
  contest_updated: '✏️',
  contest_deleted: '🗑️',
  team_created: '👥',
  team_updated: '✏️',
  team_deleted: '🗑️',
  participant_added: '➕',
  participant_removed: '➖',
  jury_assigned: '👨‍⚖️',
  jury_removed: '👨‍⚖️',
  score_submitted: '📝',
  score_updated: '📝',
  certificate_generated: '📜',
  certificate_design_saved: '🎨',
  user_login: '🔑',
  user_logout: '🚪',
};
