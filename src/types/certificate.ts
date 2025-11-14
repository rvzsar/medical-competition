// Типы для системы сертификатов

export interface CertificateRecipient {
  id: string;
  name: string;
  email: string;
  role: 'team' | 'individual';
  teamName?: string;
  place?: number;
  specialAward?: string;
  score?: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: 'team' | 'individual';
  description: string;
}

export interface CertificateData {
  recipientName: string;
  teamName?: string;
  achievement: string;
  place?: number;
  score?: number;
  date: string;
  eventName: string;
  organizerName: string;
  organizerTitle: string;
  certificateNumber: string;
}

export interface EmailData {
  to: string;
  recipientName: string;
  certificateType: 'team' | 'individual';
  achievement: string;
}

export interface CertificateGenerationResult {
  success: boolean;
  certificateId?: string;
  pdfUrl?: string;
  error?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ recipient: string; error: string }>;
}

export interface CertificateEmailTemplateConfig {
  subject: string;
  greeting: string;
  bodyTeam: string;
  bodyIndividual: string;
  footer: string;
}

export interface CertificatePdfTemplateConfig {
  teamTitle: string;
  teamIntro: string;
  individualTitle: string;
  individualIntro: string;
}

export interface CertificateTemplatesConfig {
  email: CertificateEmailTemplateConfig;
  pdf: CertificatePdfTemplateConfig;
}