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

// A5 landscape для печати на готовом бланке
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'transparent',
    padding: 0,
    fontFamily: 'Roboto',
  },
  content: {
    position: 'absolute',
    top: 95,
    left: 60,
    right: 60,
    bottom: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  nameContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  nameLine: {
    width: 320,
    borderBottom: '1px solid #333333',
    paddingBottom: 3,
  },
  participantName: {
    fontSize: 13,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
  },
  eventText: {
    fontSize: 11,
    fontWeight: 400,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: 25,
  },
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
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
}

const ParticipantCertificate: React.FC<ParticipantCertificateProps> = ({
  participantName,
  eventName = 'Олимпиада',
  eventDate,
  eventLocation = '',
}) => {
  const formattedDate = eventDate 
    ? new Date(eventDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const locationText = eventLocation ? `${eventLocation}, ` : '';

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

          {/* Описание мероприятия */}
          <Text style={styles.eventText}>
            в {eventName}
          </Text>

          {/* Дата */}
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{locationText}{formattedDate}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ParticipantCertificate;
