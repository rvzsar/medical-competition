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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Roboto',
  },
  content: {
    marginTop: 120,
    marginBottom: 80,
    marginHorizontal: 80,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Заголовок "ВРУЧАЕТСЯ"
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 2,
  },
  // Линия под заголовком (для имени)
  nameLine: {
    width: 350,
    borderBottom: '1px solid #000000',
    marginBottom: 30,
    paddingBottom: 8,
  },
  // Имя участника
  participantName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#000000',
    textAlign: 'center',
  },
  // Текст "За участие..."
  eventText: {
    fontSize: 13,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.6,
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
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.content}>
          <Text style={styles.title}>ВРУЧАЕТСЯ</Text>

          <View style={styles.nameLine}>
            <Text style={styles.participantName}>{participantName}</Text>
          </View>

          <Text style={styles.eventText}>
            За участие в I Межвузовской олимпиаде{'\n'}
            по акушерству и гинекологии{'\n'}
            им. В.В. Горячева
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ParticipantCertificate;
