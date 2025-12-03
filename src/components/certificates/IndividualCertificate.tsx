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

// A5 landscape для печати на готовом бланке РЕАВИЗ
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'transparent',
    padding: 0,
    fontFamily: 'Roboto',
  },
  // Контент размещается в центре страницы, с отступами от шапки и подписи
  content: {
    position: 'absolute',
    top: 95,
    left: 50,
    right: 50,
    bottom: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Имя участника - главный элемент
  participantName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  // Информация о команде
  teamInfo: {
    fontSize: 10,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
  },
  // Место (обычное участие)
  placeText: {
    fontSize: 12,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  // Место (призовое - крупно и жирно)
  placeTextBold: {
    fontSize: 16,
    fontWeight: 700,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  // Описание олимпиады
  eventText: {
    fontSize: 10,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: 15,
  },
  // Специальная награда
  specialAward: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  specialAwardText: {
    fontSize: 10,
    fontWeight: 500,
    color: '#333333',
    textAlign: 'center',
  },
  // Дата внизу
  dateBox: {
    backgroundColor: '#CCCCCC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
  },
  dateText: {
    fontSize: 9,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
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
}) => {
  // Определяем, является ли это призовым местом
  const isPrizePlace = achievement === 'I место' || 
                       achievement === 'II место' || 
                       achievement === 'III место';
  
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.content}>
          {/* Имя участника */}
          <Text style={styles.participantName}>{participantName}</Text>

          {/* Команда */}
          <Text style={styles.teamInfo}>команда «{teamName}»</Text>

          {/* Место */}
          <Text style={isPrizePlace ? styles.placeTextBold : styles.placeText}>
            за {achievement}
          </Text>

          {/* Описание олимпиады */}
          <Text style={styles.eventText}>
            в I Межвузовской студенческой олимпиаде по акушерству и гинекологии{'\n'}
            им. профессора В.В. Горячева.
          </Text>

          {/* Специальная награда */}
          {specialAward && (
            <View style={styles.specialAward}>
              <Text style={styles.specialAwardText}>{specialAward}</Text>
            </View>
          )}

          {/* Дата */}
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>Самара, 04 ноября 2025 г.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default IndividualCertificate;
