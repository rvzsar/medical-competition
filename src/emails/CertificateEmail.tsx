import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from '@react-email/components';

interface CertificateEmailProps {
  recipientName: string;
  certificateType: 'team' | 'individual';
  teamName?: string;
  place?: number;
  score?: number;
  eventName: string;
}

export default function CertificateEmail({
  recipientName,
  certificateType,
  teamName,
  place,
  score,
  eventName,
}: CertificateEmailProps) {
  const getPlaceText = (place?: number): string => {
    if (!place) return '';
    switch (place) {
      case 1:
        return '🥇 Победитель (I место)';
      case 2:
        return '🥈 Призер (II место)';
      case 3:
        return '🥉 Призер (III место)';
      default:
        return '🎖️ Участник';
    }
  };

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.logo}>⚕️</Text>
            <Heading style={styles.title}>
              Сертификат участника олимпиады
            </Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>
              Здравствуйте, {recipientName}!
            </Text>

            <Text style={styles.text}>
              Поздравляем вас с успешным участием в мероприятии{' '}
              <strong>"{eventName}"</strong>!
            </Text>

            {certificateType === 'team' && teamName && (
              <>
                <Text style={styles.text}>
                  Ваша команда <strong>{teamName}</strong> показала отличные
                  результаты.
                </Text>
                {place && place <= 3 && (
                  <Section style={styles.achievement}>
                    <Text style={styles.achievementText}>
                      {getPlaceText(place)}
                    </Text>
                    {score && (
                      <Text style={styles.scoreText}>
                        Итоговый балл: <strong>{score.toFixed(2)}</strong>
                      </Text>
                    )}
                  </Section>
                )}
              </>
            )}

            {certificateType === 'individual' && (
              <Text style={styles.text}>
                Вы продемонстрировали высокий уровень знаний и практических
                навыков в области акушерства и гинекологии.
              </Text>
            )}

            <Text style={styles.text}>
              Во вложении вы найдете ваш сертификат участника в формате PDF.
              Вы можете распечатать его или сохранить в электронном виде.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              С уважением,
              <br />
              <strong>Кафедра акушерства и гинекологии</strong>
            </Text>

            <Text style={styles.disclaimer}>
              Это автоматическое письмо. Пожалуйста, не отвечайте на него.
              По всем вопросам обращайтесь к организаторам мероприятия.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '40px',
    borderRadius: '8px',
    maxWidth: '600px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logo: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  title: {
    color: '#2563eb',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0',
    lineHeight: '1.3',
  },
  content: {
    padding: '0',
  },
  greeting: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
  },
  text: {
    fontSize: '16px',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  achievement: {
    backgroundColor: '#eff6ff',
    padding: '24px',
    borderRadius: '8px',
    border: '2px solid #2563eb',
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  achievementText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2563eb',
    margin: '0 0 12px 0',
  },
  scoreText: {
    fontSize: '18px',
    color: '#1e40af',
    margin: '0',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '32px 0',
  },
  footer: {
    fontSize: '16px',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  disclaimer: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.5',
    marginTop: '24px',
    fontStyle: 'italic' as const,
  },
};