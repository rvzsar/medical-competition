/**
 * Certificate PDF Generator from Design Template
 * 
 * Генерирует PDF на основе визуального шаблона из конструктора
 */

import React from 'react';
import ReactPDF, { Document, Page, Text, View, Image, StyleSheet, Font, DocumentProps } from '@react-pdf/renderer';
import type { CertificateDesignTemplate, DesignElement, PlaceholderKey } from '@/types/certificate-design';
import { PAPER_SIZES, PLACEHOLDERS } from '@/types/certificate-design';

// Регистрация Google Fonts с поддержкой кириллицы
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVI.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'PT Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/ptsans/v17/jizaRExUiTo99u79D0KExQ.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/ptsans/v17/jizfRExUiTo99u79B_mh0O6tLR8a8zI.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'PT Serif',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/ptserif/v18/EJRVQgYoZZY2vCFuvAFWzr8.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/ptserif/v18/EJRSQgYoZZY2vCFuvAnt65qVXSr3pNNB.ttf', fontWeight: 700 },
  ],
});

// Данные для подстановки в плейсхолдеры
export interface CertificateData {
  recipientName: string;
  teamName?: string;
  eventName: string;
  date: string;
  place?: number | string;
  score?: number | string;
  certificateNumber: string;
  organizerName?: string;
  organizerTitle?: string;
}

// Подстановка значений в плейсхолдеры
function replacePlaceholder(placeholder: PlaceholderKey, data: CertificateData): string {
  switch (placeholder) {
    case 'recipientName':
      return data.recipientName;
    case 'teamName':
      return data.teamName || '';
    case 'eventName':
      return data.eventName;
    case 'date':
      return data.date;
    case 'place':
      if (!data.place) return 'участие';
      if (data.place === 1) return 'I место';
      if (data.place === 2) return 'II место';
      if (data.place === 3) return 'III место';
      return String(data.place);
    case 'score':
      return data.score !== undefined ? String(data.score) : '';
    case 'certificateNumber':
      return data.certificateNumber;
    case 'organizerName':
      return data.organizerName || '';
    case 'organizerTitle':
      return data.organizerTitle || '';
    default:
      return `{{${placeholder}}}`;
  }
}

// Создание стилей для элемента
function createElementStyle(element: DesignElement, pageWidth: number, pageHeight: number) {
  const style: Record<string, unknown> = {
    position: 'absolute' as const,
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
  };

  if (element.type === 'text' || element.type === 'placeholder') {
    style.fontFamily = element.fontFamily || 'Roboto';
    style.fontSize = element.fontSize || 14;
    style.fontWeight = element.fontWeight === 'bold' ? 700 : 400;
    style.fontStyle = element.fontStyle || 'normal';
    style.color = element.color || '#000000';
    style.textAlign = element.textAlign || 'left';
    style.display = 'flex';
    style.alignItems = 'center';
    style.justifyContent = element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start';
  }

  return style;
}

// Компонент элемента
interface ElementComponentProps {
  element: DesignElement;
  data: CertificateData;
  pageWidth: number;
  pageHeight: number;
}

const ElementComponent: React.FC<ElementComponentProps> = ({ element, data, pageWidth, pageHeight }) => {
  const style = createElementStyle(element, pageWidth, pageHeight);

  if (element.type === 'image' && element.src) {
    return React.createElement(View, { style, key: element.id },
      React.createElement(Image, {
        src: element.src,
        style: {
          width: '100%',
          height: '100%',
          objectFit: element.objectFit || 'contain',
        },
      })
    );
  }

  let content = '';
  if (element.type === 'placeholder' && element.placeholder) {
    content = replacePlaceholder(element.placeholder, data);
  } else if (element.type === 'text') {
    content = element.content || '';
  }

  return React.createElement(View, { style, key: element.id },
    React.createElement(Text, {
      style: {
        fontFamily: element.fontFamily || 'Roboto',
        fontSize: element.fontSize || 14,
        fontWeight: element.fontWeight === 'bold' ? 700 : 400,
        color: element.color || '#000000',
        textAlign: element.textAlign || 'left',
      },
    }, content)
  );
};

// Основной компонент документа
interface CertificateDocumentProps {
  template: CertificateDesignTemplate;
  data: CertificateData;
}

const CertificateDocument: React.FC<CertificateDocumentProps> = ({ template, data }) => {
  const paperSize = PAPER_SIZES[template.format];
  const isLandscape = template.orientation === 'landscape';
  const pageWidth = isLandscape ? paperSize.height : paperSize.width;
  const pageHeight = isLandscape ? paperSize.width : paperSize.height;

  const pageStyle: Record<string, unknown> = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    backgroundColor: template.backgroundColor || '#ffffff',
  };

  // Сортируем элементы по zIndex
  const sortedElements = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

  return React.createElement(Document, {},
    React.createElement(Page, {
      size: template.format,
      orientation: template.orientation,
      style: pageStyle,
    },
      // Фоновое изображение
      template.backgroundImage && React.createElement(Image, {
        src: template.backgroundImage,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        },
      }),
      // Элементы
      ...sortedElements.map(element =>
        React.createElement(ElementComponent, {
          key: element.id,
          element,
          data,
          pageWidth,
          pageHeight,
        })
      )
    )
  );
};

/**
 * Генерация PDF из шаблона дизайна
 */
export async function generatePdfFromDesign(
  template: CertificateDesignTemplate,
  data: CertificateData
): Promise<Buffer> {
  const doc = React.createElement(CertificateDocument, { template, data }) as React.ReactElement<DocumentProps>;
  
  const pdfStream = await ReactPDF.renderToStream(doc);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    pdfStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    pdfStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    pdfStream.on('error', reject);
  });
}

/**
 * Генерация номера сертификата
 */
export function generateCertificateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}${month}-${random}`;
}
