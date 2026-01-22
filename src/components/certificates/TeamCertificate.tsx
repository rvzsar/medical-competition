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
  // Название команды - главный элемент
  teamName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 1.2,
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
  // Блок с баллами
  scoreBox: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#333333',
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
}) => {
  const getPlaceText = (place: number): string => {
    switch (place) {
      case 1:
        return 'I место';
      case 2:
        return 'II место';
      case 3:
        return 'III место';
      default:
        return 'участие';
    }
  };

  const isPrizePlace = place >= 1 && place <= 3;

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.content}>
          {/* Название команды */}
          <Text style={styles.teamName}>«{teamName}»</Text>

          {/* Место */}
          <Text style={isPrizePlace ? styles.placeTextBold : styles.placeText}>
            за {getPlaceText(place)}
          </Text>

          {/* Описание олимпиады */}
          <Text style={styles.eventText}>
            в {eventName}
          </Text>

          {/* Баллы */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Итоговый балл:</Text>
            <Text style={styles.scoreValue}>{score.toFixed(2)}</Text>
          </View>

          {/* Дата */}
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TeamCertificate;
