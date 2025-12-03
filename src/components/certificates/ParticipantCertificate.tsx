import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

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
// Текст размещается в центральной области между заголовком "СЕРТИФИКАТ" и подписью/печатью
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
    top: 95,      // Отступ от верха (под "СЕРТИФИКАТ")
    left: 60,
    right: 60,
    bottom: 85,   // Отступ снизу (над подписью и печатью)
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Заголовок "ОБ УЧАСТИИ"
  title: {
    fontSize: 14,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  // Контейнер для имени с линией
  nameContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  // Линия для имени
  nameLine: {
    width: 320,
    borderBottom: '1px solid #333333',
    paddingBottom: 3,
  },
  // Имя участника
  participantName: {
    fontSize: 13,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
  },
  // Текст описания олимпиады
  eventText: {
    fontSize: 11,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: 25,
  },
  // Дата
  dateBox: {
    backgroundColor: '#CCCCCC',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
  },
});

export interface ParticipantCertificateProps {
  participantName: string;
}

const ParticipantCertificate: React.FC<ParticipantCertificateProps> = ({
  participantName,
}) => {
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.content}>
          {/* Заголовок */}
          <Text style={styles.title}>ОБ УЧАСТИИ</Text>

          {/* Имя участника с линией */}
          <View style={styles.nameContainer}>
            <View style={styles.nameLine}>
              <Text style={styles.participantName}>{participantName}</Text>
            </View>
          </View>

          {/* Описание олимпиады */}
          <Text style={styles.eventText}>
            в I Межвузовской студенческой олимпиаде по акушерству и гинекологии{'\n'}
            им. профессора В.В. Горячева.
          </Text>

          {/* Дата */}
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>Самара, 04 ноября 2025 г.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ParticipantCertificate;
