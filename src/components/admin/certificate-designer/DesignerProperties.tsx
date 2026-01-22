'use client';

import type { DesignElement, FontFamily, TextAlign, PlaceholderKey } from '@/types/certificate-design';
import { PLACEHOLDERS } from '@/types/certificate-design';

interface DesignerPropertiesProps {
  element: DesignElement | null;
  onUpdate: (updates: Partial<DesignElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'PT Sans', label: 'PT Sans' },
  { value: 'PT Serif', label: 'PT Serif' },
];

const ALIGN_OPTIONS: { value: TextAlign; label: string; icon: string }[] = [
  { value: 'left', label: 'Слева', icon: '⬅' },
  { value: 'center', label: 'По центру', icon: '⬌' },
  { value: 'right', label: 'Справа', icon: '➡' },
];

export default function DesignerProperties({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
}: DesignerPropertiesProps) {
  if (!element) {
    return (
      <div className="w-72 bg-white border-l p-4">
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">👆</div>
          <p className="text-sm">Выберите элемент для редактирования</p>
        </div>
      </div>
    );
  }

  const isTextOrPlaceholder = element.type === 'text' || element.type === 'placeholder';

  return (
    <div className="w-72 bg-white border-l overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {element.type === 'text' && 'Текст'}
            {element.type === 'placeholder' && 'Поле'}
            {element.type === 'image' && 'Изображение'}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={onDuplicate}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Дублировать"
            >
              📋
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Placeholder type selector */}
        {element.type === 'placeholder' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Тип поля
            </label>
            <select
              value={element.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value as PlaceholderKey })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            >
              {(Object.entries(PLACEHOLDERS) as [PlaceholderKey, { label: string }][]).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Text content */}
        {element.type === 'text' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Текст
            </label>
            <textarea
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Font settings */}
        {isTextOrPlaceholder && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Шрифт
              </label>
              <select
                value={element.fontFamily || 'Open Sans'}
                onChange={(e) => onUpdate({ fontFamily: e.target.value as FontFamily })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              >
                {FONT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Размер
                </label>
                <input
                  type="number"
                  value={element.fontSize || 14}
                  onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 14 })}
                  min={8}
                  max={72}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Цвет
                </label>
                <input
                  type="color"
                  value={element.color || '#000000'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="w-full h-8 rounded border cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`flex-1 px-2 py-1.5 text-sm border rounded font-bold ${
                  element.fontWeight === 'bold' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
                }`}
              >
                B
              </button>
              <button
                onClick={() => onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`flex-1 px-2 py-1.5 text-sm border rounded italic ${
                  element.fontStyle === 'italic' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
                }`}
              >
                I
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Выравнивание
              </label>
              <div className="flex gap-1">
                {ALIGN_OPTIONS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ textAlign: value })}
                    className={`flex-1 px-2 py-1.5 text-sm border rounded ${
                      element.textAlign === value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
                    }`}
                    title={label}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Image settings */}
        {element.type === 'image' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Масштабирование
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ objectFit: 'contain' })}
                className={`flex-1 px-2 py-1.5 text-sm border rounded ${
                  element.objectFit === 'contain' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
                }`}
              >
                Вписать
              </button>
              <button
                onClick={() => onUpdate({ objectFit: 'cover' })}
                className={`flex-1 px-2 py-1.5 text-sm border rounded ${
                  element.objectFit === 'cover' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300'
                }`}
              >
                Заполнить
              </button>
            </div>
          </div>
        )}

        <hr />

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Позиция (%)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => onUpdate({ x: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => onUpdate({ y: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Размер (%)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Ширина</label>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => onUpdate({ width: parseFloat(e.target.value) || 10 })}
                min={5}
                max={100}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Высота</label>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => onUpdate({ height: parseFloat(e.target.value) || 5 })}
                min={3}
                max={100}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Layer */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Слой
          </label>
          <input
            type="number"
            value={element.zIndex}
            onChange={(e) => onUpdate({ zIndex: parseInt(e.target.value) || 1 })}
            min={1}
            max={100}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
}
