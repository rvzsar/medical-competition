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

// A5 landscape: 210mm x 148mm (595 x 420 pt)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Roboto',
    width: 595,
    height: 420,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
    paddingTop: 40,
    paddingBottom: 30,
  },
  // Заголовок "ОБ УЧАСТИИ"
  title: {
    fontSize: 16,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 3,
  },
  // Контейнер для имени с линией
  nameContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  // Линия для имени
  nameLine: {
    width: 380,
    borderBottom: '1px solid #000000',
    paddingBottom: 5,
    marginBottom: 8,
  },
  // Имя участника (над линией)
  participantName: {
    fontSize: 14,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'center',
  },
  // Текст описания олимпиады
  eventText: {
    fontSize: 12,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 50,
  },
  // Дата внизу
  dateContainer: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dateBox: {
    backgroundColor: '#D0D0D0',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'center',
  },
});

export interface ParticipantCertificateProps {
  participantName: string;
}

const ParticipantCertificate: React.FC<ParticipantCertificateProps> = ({
  participantName,
}) => {
  // Форматирование даты
  const eventDate = new Date(2025, 10, 4); // 4 ноября 2025
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

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
        </View>

        {/* Дата внизу */}
        <View style={styles.dateContainer}>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>Самара, {formattedDate}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ParticipantCertificate;
