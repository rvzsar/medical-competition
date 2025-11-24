import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { LOGO_BASE64 } from './logoBase64';

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
    padding: 30,
    fontFamily: 'Roboto',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    border: '3px solid #2563EB',
    borderRadius: 8,
  },
  innerBorder: {
    position: 'absolute',
    top: 22,
    left: 22,
    right: 22,
    bottom: 22,
    border: '1px solid #93C5FD',
    borderRadius: 6,
  },
  header: {
    marginTop: 30,
    marginBottom: 15,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    color: '#2563EB',
    fontWeight: 700,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#1E40AF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 25,
    lineHeight: 1.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  awardText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 15,
  },
  teamName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  achievement: {
    fontSize: 18,
    fontWeight: 500,
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    border: '2px solid #DBEAFE',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: 700,
    color: '#2563EB',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerColumn: {
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
  },
  signatureLine: {
    width: 150,
    borderTop: '1px solid #CBD5E1',
    marginTop: 20,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  signatureName: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 500,
    marginTop: 3,
  },
  certificateNumber: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  medicalSymbol: {
    fontSize: 24,
    color: '#2563EB',
    marginBottom: 10,
  },
});

export interface TeamCertificateProps {
  teamName: string;
  place: number;
  score: number;
  date: string;
  eventName: string;
  organizerName: string;
  organizerTitle: string;
  certificateNumber: string;
  titleText?: string;
  introText?: string;
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
  titleText,
  introText,
}) => {
  const getPlaceText = (place: number): string => {
    switch (place) {
      case 1:
        return 'заняла I место';
      case 2:
        return 'заняла II место';
      case 3:
        return 'заняла III место';
      default:
        return 'приняла участие';
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
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.decorativeBorder} />
        <View style={styles.innerBorder} />

        <View style={styles.header}>
          <View style={styles.logo}>
            <Image 
              src={LOGO_BASE64}
              style={{ width: 50, height: 50 }} 
            />
          </View>
          <Text style={styles.title}>{titleText || 'СЕРТИФИКАТ'}</Text>
          <Text style={styles.subtitle}>
            {eventName.split('\\n').map((line, index) => (
              <React.Fragment key={index}>
                {index > 0 && '\n'}
                {line}
              </React.Fragment>
            ))}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.awardText}>
            {introText || 'Настоящий сертификат подтверждает, что команда'}
          </Text>
          
          <Text style={styles.teamName}>{teamName}</Text>

          <Text style={[styles.achievement, { color: getPlaceColor(place) }]}>
            {getPlaceText(place)}
          </Text>

          <Text style={styles.awardText}>
            в олимпиаде по акушерству и гинекологии
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