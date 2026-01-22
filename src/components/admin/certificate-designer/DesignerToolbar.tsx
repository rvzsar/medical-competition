'use client';

import { useRef, useState } from 'react';
import type { 
  PaperFormat, 
  PaperOrientation, 
  DesignElement,
  PlaceholderKey,
} from '@/types/certificate-design';
import { 
  PLACEHOLDERS, 
  createTextElement, 
  createPlaceholderElement,
  createImageElement,
} from '@/types/certificate-design';

interface DesignerToolbarProps {
  format: PaperFormat;
  orientation: PaperOrientation;
  backgroundColor: string;
  backgroundImage?: string;
  onFormatChange: (format: PaperFormat) => void;
  onOrientationChange: (orientation: PaperOrientation) => void;
  onBackgroundChange: (color?: string, image?: string) => void;
  onAddElement: (element: DesignElement) => void;
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limit)

export default function DesignerToolbar({
  format,
  orientation,
  backgroundColor,
  backgroundImage,
  onFormatChange,
  onOrientationChange,
  onBackgroundChange,
  onAddElement,
}: DesignerToolbarProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'background'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(`Файл слишком большой. Максимум ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload to Vercel Blob via API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/certificates/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка загрузки');
      }

      const { url } = await response.json();
      
      if (type === 'logo') {
        onAddElement(createImageElement(url));
      } else {
        onBackgroundChange(undefined, url);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleAddPlaceholder = (key: PlaceholderKey) => {
    onAddElement(createPlaceholderElement(key));
  };

  return (
    <div className="w-64 bg-white border-r overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Формат бумаги */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Формат</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onFormatChange('A4')}
              className={`flex-1 px-3 py-2 text-sm rounded border ${
                format === 'A4' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              A4
            </button>
            <button
              onClick={() => onFormatChange('A5')}
              className={`flex-1 px-3 py-2 text-sm rounded border ${
                format === 'A5' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              A5
            </button>
          </div>
        </section>

        {/* Ориентация */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Ориентация</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onOrientationChange('portrait')}
              className={`flex-1 px-3 py-2 text-sm rounded border flex items-center justify-center gap-1 ${
                orientation === 'portrait' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">▯</span> Книжная
            </button>
            <button
              onClick={() => onOrientationChange('landscape')}
              className={`flex-1 px-3 py-2 text-sm rounded border flex items-center justify-center gap-1 ${
                orientation === 'landscape' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg rotate-90">▯</span> Альбом
            </button>
          </div>
        </section>

        {/* Фон */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Фон</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Цвет:</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundChange(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
            </div>
            <div>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => handleImageUpload(e, 'background')}
                className="hidden"
              />
              <button
                onClick={() => bgInputRef.current?.click()}
                disabled={isUploading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {isUploading ? '⏳ Загрузка...' : '📷 Загрузить фон'}
              </button>
              {backgroundImage && (
                <button
                  onClick={() => onBackgroundChange(undefined, '')}
                  className="w-full mt-1 px-3 py-1 text-xs text-red-600 hover:text-red-800"
                >
                  Удалить фон
                </button>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-red-600 mt-1">{uploadError}</p>
            )}
          </div>
        </section>

        <hr />

        {/* Добавить текст */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Добавить текст</h3>
          <button
            onClick={() => onAddElement(createTextElement())}
            className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 flex items-center gap-2"
          >
            <span className="text-lg">T</span> Текстовый блок
          </button>
        </section>

        {/* Плейсхолдеры */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Динамические поля</h3>
          <div className="space-y-1">
            {(Object.entries(PLACEHOLDERS) as [PlaceholderKey, { label: string }][]).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => handleAddPlaceholder(key)}
                className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 flex items-center gap-2"
              >
                <span className="text-blue-500 text-xs font-mono">{`{{...}}`}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Логотип */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Изображение</h3>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={(e) => handleImageUpload(e, 'logo')}
            className="hidden"
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploading}
            className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            <span className="text-lg">🖼️</span> 
            {isUploading ? 'Загрузка...' : 'Добавить логотип'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, SVG. Макс. {MAX_IMAGE_SIZE / 1024 / 1024}MB
          </p>
        </section>
      </div>
    </div>
  );
}
