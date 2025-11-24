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
    padding: 0,
    fontFamily: 'Roboto',
  },
  // Основная область для печати текста (центр бланка)
  content: {
    marginTop: 100, // Отступ от верха бланка (где логотип и шапка)
    marginBottom: 80, // Отступ от низа бланка (где подпись и печать)
    marginHorizontal: 60,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Вводный текст
  introText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 25,
  },
  // Название команды - главный элемент
  teamName: {
    fontSize: 26,
    fontWeight: 700,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 1.3,
  },
  // Достижение (место)
  achievement: {
    fontSize: 18,
    fontWeight: 600,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 25,
  },
  // Блок с баллами
  scoreBox: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#000000',
  },
  // Дата внизу слева
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 11,
    color: '#000000',
  },
  // Номер сертификата внизу справа
  certificateNumber: {
    fontSize: 10,
    color: '#000000',
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
  certificateNumber,
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

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Центральная область для печати текста */}
        <View style={styles.content}>
          <Text style={styles.introText}>
            {introText || 'Настоящий сертификат подтверждает, что команда'}
          </Text>
          
          <Text style={styles.teamName}>«{teamName}»</Text>

          <Text style={styles.achievement}>
            {getPlaceText(place)}
          </Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Итоговый балл:</Text>
            <Text style={styles.scoreValue}>{score.toFixed(2)}</Text>
          </View>
        </View>

        {/* Футер с датой и номером */}
        <View style={styles.footer}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.certificateNumber}>№ {certificateNumber}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TeamCertificate;