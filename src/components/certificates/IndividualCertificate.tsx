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
  // Имя участника - главный элемент
  participantName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 1.3,
  },
  // Информация о команде
  teamInfo: {
    fontSize: 13,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Достижение
  achievement: {
    fontSize: 13,
    fontWeight: 500,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.6,
    paddingHorizontal: 40,
  },
  // Выделение для призового места
  achievementBold: {
    fontSize: 13,
    fontWeight: 700,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.6,
    paddingHorizontal: 40,
  },
  // Специальная награда (если есть)
  specialAward: {
    marginTop: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  specialAwardText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#000000',
    textAlign: 'center',
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
  certificateNumber,
  introText,
}) => {
  // Определяем, является ли это призовым местом
  const isPrizePlace = achievement.includes('I место') || 
                       achievement.includes('II место') || 
                       achievement.includes('III место');
  
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Центральная область для печати текста */}
        <View style={styles.content}>
          <Text style={styles.introText}>
            {introText || 'Настоящий сертификат выдан'}
          </Text>
          
          <Text style={styles.participantName}>{participantName}</Text>

          <Text style={styles.teamInfo}>команда «{teamName}»</Text>

          <Text style={isPrizePlace ? styles.achievementBold : styles.achievement}>
            {achievement}
          </Text>

          {specialAward && (
            <View style={styles.specialAward}>
              <Text style={styles.specialAwardText}>{specialAward}</Text>
            </View>
          )}
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

export default IndividualCertificate;