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
    border: '3px solid #2563EB',
    borderRadius: 8,
  },
  innerBorder: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    border: '1px solid #93C5FD',
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
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    color: '#2563EB',
    fontWeight: 700,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1E40AF',
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
  teamName: {
    fontSize: 36,
    fontWeight: 700,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  achievement: {
    fontSize: 20,
    fontWeight: 500,
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 15,
  },
  scoreBox: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    border: '2px solid #DBEAFE',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 700,
    color: '#2563EB',
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
  medicalSymbol: {
    fontSize: 24,
    color: '#2563EB',
    marginBottom: 10,
  },
});

interface TeamCertificateProps {
  teamName: string;
  place: number;
  score: number;
  date: string;
  eventName: string;
  organizerName: string;
  organizerTitle: string;
  certificateNumber: string;
}

const TeamCertificate: React.FC<TeamCertificateProps> = ({
  teamName,
  place,
  score,
  date,
  eventName,
  organizerName,
  organizerTitle,
  certificateNumber,
}) => {
  const getPlaceText = (place: number): string => {
    switch (place) {
      case 1:
        return 'ПОБЕДИТЕЛЯ (I место)';
      case 2:
        return 'ПРИЗЕРА (II место)';
      case 3:
        return 'ПРИЗЕРА (III место)';
      default:
        return 'УЧАСТНИКА';
    }
  };

  const getPlaceColor = (place: number): string => {
    switch (place) {
      case 1:
        return '#EAB308';
      case 2:
        return '#94A3B8';
      case 3:
        return '#CD7F32';
      default:
        return '#2563EB';
    }
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.decorativeBorder} />
        <View style={styles.innerBorder} />

        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>⚕</Text>
          </View>
          <Text style={styles.title}>СЕРТИФИКАТ</Text>
          <Text style={styles.subtitle}>{eventName}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.awardText}>Настоящий сертификат подтверждает, что команда</Text>
          
          <Text style={styles.teamName}>{teamName}</Text>

          <Text style={[styles.achievement, { color: getPlaceColor(place) }]}>
            стала {getPlaceText(place)}
          </Text>

          <Text style={styles.awardText}>
            олимпиады по акушерству и гинекологии
          </Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Итоговый балл</Text>
            <Text style={styles.scoreValue}>{score.toFixed(2)}</Text>
          </View>
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

export default TeamCertificate;