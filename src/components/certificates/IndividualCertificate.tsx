import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Регистрация шрифтов для поддержки кириллицы
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Roboto',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: '3px solid #7C3AED',
    borderRadius: 8,
  },
  innerBorder: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    border: '1px solid #C4B5FD',
    borderRadius: 6,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    color: '#7C3AED',
    fontWeight: 700,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#6D28D9',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  awardText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  participantName: {
    fontSize: 38,
    fontWeight: 700,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 30,
    paddingVertical: 18,
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    borderBottom: '3px solid #7C3AED',
  },
  teamInfo: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  achievement: {
    fontSize: 20,
    fontWeight: 500,
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 15,
  },
  specialAward: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    border: '2px solid #FCD34D',
    alignItems: 'center',
  },
  specialAwardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  specialAwardText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#92400E',
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid #E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerColumn: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  signatureLine: {
    width: 200,
    borderTop: '1px solid #CBD5E1',
    marginTop: 30,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  signatureName: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 500,
    marginTop: 4,
  },
  certificateNumber: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 10,
  },
});

export interface IndividualCertificateProps {
  participantName: string;
  teamName: string;
  achievement: string;
  specialAward?: string;
  date: string;
  eventName: string;
  organizerName: string;
  organizerTitle: string;
  certificateNumber: string;
  titleText?: string;
  introText?: string;
}

const IndividualCertificate: React.FC<IndividualCertificateProps> = ({
  participantName,
  teamName,
  achievement,
  specialAward,
  date,
  eventName,
  organizerName,
  organizerTitle,
  certificateNumber,
  titleText,
  introText,
}) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.decorativeBorder} />
        <View style={styles.innerBorder} />

        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>⚕</Text>
          </View>
          <Text style={styles.title}>{titleText || 'ИМЕННОЙ СЕРТИФИКАТ'}</Text>
          <Text style={styles.subtitle}>{eventName}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.awardText}>{introText || 'Настоящий сертификат выдан'}</Text>
          
          <Text style={styles.participantName}>{participantName}</Text>

          <Text style={styles.teamInfo}>Команда: {teamName}</Text>

          <Text style={styles.achievement}>{achievement}</Text>

          <Text style={styles.awardText}>
            за активное участие в олимпиаде по акушерству и гинекологии
          </Text>

          {specialAward && (
            <View style={styles.specialAward}>
              <Text style={styles.specialAwardIcon}>🏆</Text>
              <Text style={styles.specialAwardText}>{specialAward}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerColumn}>
            <Text style={styles.dateText}>Дата выдачи:</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          <View style={[styles.footerColumn, { alignItems: 'flex-end' }]}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Организатор</Text>
            <Text style={styles.signatureName}>{organizerName}</Text>
            <Text style={styles.signatureLabel}>{organizerTitle}</Text>
          </View>
        </View>

        <Text style={styles.certificateNumber}>№ {certificateNumber}</Text>
      </Page>
    </Document>
  );
};

export default IndividualCertificate;