/**
 * Типы для графического конструктора сертификатов
 */

export type PaperFormat = 'A4' | 'A5';
export type PaperOrientation = 'portrait' | 'landscape';
export type ElementType = 'text' | 'placeholder' | 'image';
export type TextAlign = 'left' | 'center' | 'right';
export type FontFamily = 'Roboto' | 'Open Sans' | 'PT Sans' | 'PT Serif';

// Доступные плейсхолдеры
export const PLACEHOLDERS = {
  recipientName: { label: 'ФИО участника', example: 'Иванов Иван Иванович' },
  teamName: { label: 'Название команды', example: 'Команда "Медики"' },
  eventName: { label: 'Название мероприятия', example: 'Медицинская олимпиада 2026' },
  date: { label: 'Дата', example: '22 января 2026 г.' },
  place: { label: 'Место', example: '1' },
  score: { label: 'Баллы', example: '95.5' },
  certificateNumber: { label: 'Номер сертификата', example: 'CERT-2026-001' },
  organizerName: { label: 'Имя организатора', example: 'Петров П.П.' },
  organizerTitle: { label: 'Должность организатора', example: 'Председатель оргкомитета' },
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

// Размеры бумаги в мм
export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
} as const;

// Элемент дизайна
export interface DesignElement {
  id: string;
  type: ElementType;
  
  // Позиция в процентах (0-100)
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Общие свойства
  zIndex: number;
  
  // Для text и placeholder
  content?: string;
  placeholder?: PlaceholderKey;
  fontFamily?: FontFamily;
  fontSize?: number; // в pt
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: TextAlign;
  
  // Для image
  src?: string; // base64 data URL
  objectFit?: 'contain' | 'cover';
}

// Шаблон дизайна сертификата
export interface CertificateDesignTemplate {
  id: string;
  name: string;
  eventId: string;
  format: PaperFormat;
  orientation: PaperOrientation;
  
  // Фон
  backgroundColor: string;
  backgroundImage?: string; // base64 data URL
  
  // Элементы
  elements: DesignElement[];
  
  // Метаданные
  createdAt: string;
  updatedAt: string;
}

// Дефолтный шаблон
export const DEFAULT_TEMPLATE: Omit<CertificateDesignTemplate, 'id' | 'eventId' | 'createdAt' | 'updatedAt'> = {
  name: 'Новый шаблон',
  format: 'A4',
  orientation: 'portrait',
  backgroundColor: '#ffffff',
  elements: [
    {
      id: 'title',
      type: 'text',
      x: 10,
      y: 8,
      width: 80,
      height: 8,
      zIndex: 1,
      content: 'СЕРТИФИКАТ',
      fontFamily: 'PT Serif',
      fontSize: 36,
      fontWeight: 'bold',
      color: '#1a365d',
      textAlign: 'center',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 10,
      y: 18,
      width: 80,
      height: 5,
      zIndex: 1,
      content: 'подтверждает, что',
      fontFamily: 'Open Sans',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#4a5568',
      textAlign: 'center',
    },
    {
      id: 'recipient',
      type: 'placeholder',
      x: 10,
      y: 28,
      width: 80,
      height: 8,
      zIndex: 1,
      placeholder: 'recipientName',
      fontFamily: 'PT Serif',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#2d3748',
      textAlign: 'center',
    },
    {
      id: 'participation',
      type: 'text',
      x: 10,
      y: 40,
      width: 80,
      height: 5,
      zIndex: 1,
      content: 'принял(а) участие в мероприятии',
      fontFamily: 'Open Sans',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#4a5568',
      textAlign: 'center',
    },
    {
      id: 'event',
      type: 'placeholder',
      x: 10,
      y: 48,
      width: 80,
      height: 6,
      zIndex: 1,
      placeholder: 'eventName',
      fontFamily: 'PT Sans',
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2b6cb0',
      textAlign: 'center',
    },
    {
      id: 'date',
      type: 'placeholder',
      x: 10,
      y: 85,
      width: 30,
      height: 4,
      zIndex: 1,
      placeholder: 'date',
      fontFamily: 'Open Sans',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#718096',
      textAlign: 'left',
    },
    {
      id: 'organizer',
      type: 'placeholder',
      x: 60,
      y: 85,
      width: 30,
      height: 4,
      zIndex: 1,
      placeholder: 'organizerName',
      fontFamily: 'Open Sans',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#718096',
      textAlign: 'right',
    },
  ],
};

// Утилиты
export function generateElementId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createTextElement(partial?: Partial<DesignElement>): DesignElement {
  return {
    id: generateElementId(),
    type: 'text',
    x: 10,
    y: 50,
    width: 80,
    height: 5,
    zIndex: 10,
    content: 'Новый текст',
    fontFamily: 'Open Sans',
    fontSize: 14,
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'center',
    ...partial,
  };
}

export function createPlaceholderElement(placeholder: PlaceholderKey, partial?: Partial<DesignElement>): DesignElement {
  return {
    id: generateElementId(),
    type: 'placeholder',
    x: 10,
    y: 50,
    width: 80,
    height: 6,
    zIndex: 10,
    placeholder,
    fontFamily: 'PT Sans',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    ...partial,
  };
}

export function createImageElement(src: string, partial?: Partial<DesignElement>): DesignElement {
  return {
    id: generateElementId(),
    type: 'image',
    x: 40,
    y: 5,
    width: 20,
    height: 15,
    zIndex: 5,
    src,
    objectFit: 'contain',
    ...partial,
  };
}
