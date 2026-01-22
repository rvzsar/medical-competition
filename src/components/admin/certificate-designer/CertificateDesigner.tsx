'use client';

import { useState, useCallback, useEffect } from 'react';
import type { 
  CertificateDesignTemplate, 
  DesignElement,
  PaperFormat,
  PaperOrientation,
} from '@/types/certificate-design';
import { DEFAULT_TEMPLATE, generateElementId } from '@/types/certificate-design';
import DesignerCanvas from './DesignerCanvas';
import DesignerToolbar from './DesignerToolbar';
import DesignerProperties from './DesignerProperties';

interface CertificateDesignerProps {
  eventId: string;
  initialTemplate?: CertificateDesignTemplate;
  onSave?: (template: CertificateDesignTemplate) => Promise<void>;
}

export default function CertificateDesigner({
  eventId,
  initialTemplate,
  onSave,
}: CertificateDesignerProps) {
  // Состояние шаблона
  const [template, setTemplate] = useState<CertificateDesignTemplate>(() => {
    if (initialTemplate) return initialTemplate;
    
    return {
      ...DEFAULT_TEMPLATE,
      id: generateElementId(),
      eventId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Выбранный элемент
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Состояние сохранения
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Zoom
  const [zoom, setZoom] = useState(0.7);

  // Получить выбранный элемент
  const selectedElement = selectedElementId 
    ? template.elements.find(el => el.id === selectedElementId) 
    : null;

  // Обновить элемент
  const updateElement = useCallback((elementId: string, updates: Partial<DesignElement>) => {
    setTemplate(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  // Добавить элемент
  const addElement = useCallback((element: DesignElement) => {
    setTemplate(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: [...prev.elements, element],
    }));
    setSelectedElementId(element.id);
  }, []);

  // Удалить элемент
  const deleteElement = useCallback((elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: prev.elements.filter(el => el.id !== elementId),
    }));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  // Дублировать элемент
  const duplicateElement = useCallback((elementId: string) => {
    const element = template.elements.find(el => el.id === elementId);
    if (!element) return;
    
    const newElement: DesignElement = {
      ...element,
      id: generateElementId(),
      x: Math.min(element.x + 5, 90),
      y: Math.min(element.y + 5, 90),
    };
    
    addElement(newElement);
  }, [template.elements, addElement]);

  // Изменить формат/ориентацию
  const updateFormat = useCallback((format: PaperFormat) => {
    setTemplate(prev => ({ ...prev, format, updatedAt: new Date().toISOString() }));
  }, []);

  const updateOrientation = useCallback((orientation: PaperOrientation) => {
    setTemplate(prev => ({ ...prev, orientation, updatedAt: new Date().toISOString() }));
  }, []);

  // Изменить фон
  const updateBackground = useCallback((color?: string, image?: string) => {
    setTemplate(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      ...(color !== undefined && { backgroundColor: color }),
      ...(image !== undefined && { backgroundImage: image || undefined }),
    }));
  }, []);

  // Сохранить шаблон
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      await onSave(template);
      setSaveMessage({ type: 'success', text: 'Шаблон сохранён' });
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка сохранения' 
      });
    } finally {
      setIsSaving(false);
    }
  }, [template, onSave]);

  // Автоскрытие сообщения
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        // Не удалять если фокус в input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        
        e.preventDefault();
        deleteElement(selectedElementId);
      }
      
      // Duplicate with Ctrl+D
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId) {
        e.preventDefault();
        duplicateElement(selectedElementId);
      }
      
      // Save with Ctrl+S
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
      
      // Deselect with Escape
      if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement, duplicateElement, handleSave]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Конструктор сертификатов
          </h2>
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            placeholder="Название шаблона"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <DesignerToolbar
          format={template.format}
          orientation={template.orientation}
          backgroundColor={template.backgroundColor}
          backgroundImage={template.backgroundImage}
          onFormatChange={updateFormat}
          onOrientationChange={updateOrientation}
          onBackgroundChange={updateBackground}
          onAddElement={addElement}
        />

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
          <div className="flex flex-col items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button 
                onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
                className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-16 text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                +
              </button>
            </div>
            
            <DesignerCanvas
              template={template}
              selectedElementId={selectedElementId}
              zoom={zoom}
              onSelectElement={setSelectedElementId}
              onUpdateElement={updateElement}
            />
          </div>
        </div>

        {/* Properties panel */}
        <DesignerProperties
          element={selectedElement}
          onUpdate={(updates) => selectedElementId && updateElement(selectedElementId, updates)}
          onDelete={() => selectedElementId && deleteElement(selectedElementId)}
          onDuplicate={() => selectedElementId && duplicateElement(selectedElementId)}
        />
      </div>
    </div>
  );
}
