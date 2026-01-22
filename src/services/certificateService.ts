/**
 * Certificate Service - управление шаблонами сертификатов
 * 
 * Requirements: 10.1, 10.2
 */

import { safeGet, safeSet } from '@/lib/redis-wrapper';
import { CertificateTemplatesConfig } from '@/types/certificate';

const KEYS = {
  CERTIFICATE_TEMPLATES: (eventId: string) => `event:${eventId}:certificate-templates`,
};

const DEFAULT_CERTIFICATE_TEMPLATES: CertificateTemplatesConfig = {
  email: {
    subject: 'Сертификат участника – {{eventName}}',
    greeting: 'Здравствуйте, {{recipientName}}!',
    bodyTeam:
      'Ваша команда {{teamName}} приняла участие в мероприятии "{{eventName}}" и показала достойные результаты.',
    bodyIndividual:
      'Вы приняли участие в мероприятии "{{eventName}}" и продемонстрировали высокий уровень знаний и практических навыков.',
    footer:
      'С уважением,\n{{organizerName}}\n{{organizerTitle}}\n{{eventName}}',
  },
  pdf: {
    teamTitle: 'СЕРТИФИКАТ',
    teamIntro: 'Настоящий сертификат подтверждает, что команда',
    individualTitle: 'ИМЕННОЙ СЕРТИФИКАТ',
    individualIntro: 'Настоящий сертификат выдан',
  },
  organizer: {
    name: 'Кафедра акушерства и гинекологии',
    title: 'Заведующий кафедрой',
    eventName: 'Олимпиада по акушерству и гинекологии',
  },
};

/**
 * Получить шаблоны сертификатов для мероприятия
 */
export async function getCertificateTemplates(eventId: string): Promise<CertificateTemplatesConfig> {
  const raw = await safeGet(KEYS.CERTIFICATE_TEMPLATES(eventId), null);

  if (!raw) {
    return DEFAULT_CERTIFICATE_TEMPLATES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CertificateTemplatesConfig>;

    return {
      email: {
        subject: parsed.email?.subject || DEFAULT_CERTIFICATE_TEMPLATES.email.subject,
        greeting: parsed.email?.greeting || DEFAULT_CERTIFICATE_TEMPLATES.email.greeting,
        bodyTeam: parsed.email?.bodyTeam || DEFAULT_CERTIFICATE_TEMPLATES.email.bodyTeam,
        bodyIndividual:
          parsed.email?.bodyIndividual || DEFAULT_CERTIFICATE_TEMPLATES.email.bodyIndividual,
        footer: parsed.email?.footer || DEFAULT_CERTIFICATE_TEMPLATES.email.footer,
      },
      pdf: {
        teamTitle: parsed.pdf?.teamTitle || DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamTitle,
        teamIntro: parsed.pdf?.teamIntro || DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamIntro,
        individualTitle:
          parsed.pdf?.individualTitle || DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualTitle,
        individualIntro:
          parsed.pdf?.individualIntro || DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualIntro,
      },
      organizer: {
        name: parsed.organizer?.name || DEFAULT_CERTIFICATE_TEMPLATES.organizer.name,
        title: parsed.organizer?.title || DEFAULT_CERTIFICATE_TEMPLATES.organizer.title,
        eventName: parsed.organizer?.eventName || DEFAULT_CERTIFICATE_TEMPLATES.organizer.eventName,
      },
    };
  } catch {
    return DEFAULT_CERTIFICATE_TEMPLATES;
  }
}

/**
 * Сохранить шаблоны сертификатов для мероприятия
 */
export async function saveCertificateTemplates(
  eventId: string,
  templates: CertificateTemplatesConfig,
): Promise<CertificateTemplatesConfig> {
  const sanitized: CertificateTemplatesConfig = {
    email: {
      subject: templates.email.subject?.toString().slice(0, 300) || DEFAULT_CERTIFICATE_TEMPLATES.email.subject,
      greeting:
        templates.email.greeting?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.greeting,
      bodyTeam:
        templates.email.bodyTeam?.toString().slice(0, 1000) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.bodyTeam,
      bodyIndividual:
        templates.email.bodyIndividual?.toString().slice(0, 1000) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.bodyIndividual,
      footer:
        templates.email.footer?.toString().slice(0, 500) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.footer,
    },
    pdf: {
      teamTitle:
        templates.pdf.teamTitle?.toString().slice(0, 100) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamTitle,
      teamIntro:
        templates.pdf.teamIntro?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamIntro,
      individualTitle:
        templates.pdf.individualTitle?.toString().slice(0, 100) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualTitle,
      individualIntro:
        templates.pdf.individualIntro?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualIntro,
    },
    organizer: {
      name:
        templates.organizer.name?.toString().slice(0, 200) ||
        DEFAULT_CERTIFICATE_TEMPLATES.organizer.name,
      title:
        templates.organizer.title?.toString().slice(0, 200) ||
        DEFAULT_CERTIFICATE_TEMPLATES.organizer.title,
      eventName:
        templates.organizer.eventName?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.organizer.eventName,
    },
  };

  await safeSet(KEYS.CERTIFICATE_TEMPLATES(eventId), JSON.stringify(sanitized));
  return sanitized;
}
