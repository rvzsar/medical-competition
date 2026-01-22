'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { CertificateDesignTemplate, DesignElement } from '@/types/certificate-design';
import { PAPER_SIZES, PLACEHOLDERS } from '@/types/certificate-design';

interface DesignerCanvasProps {
  template: CertificateDesignTemplate;
  selectedElementId: string | null;
  zoom: number;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
}

// Размеры canvas в пикселях (базовые, до zoom)
const BASE_DPI = 96;
const MM_TO_PX = BASE_DPI / 25.4;

export default function DesignerCanvas({
  template,
  selectedElementId,
  zoom,
  onSelectElement,
  onUpdateElement,
}: DesignerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: string; startX: number; startY: number; elemW: number; elemH: number; elemX: number; elemY: number } | null>(null);

  // Вычислить размеры canvas
  const paperSize = PAPER_SIZES[template.format];
  const isLandscape = template.orientation === 'landscape';
  const canvasWidth = (isLandscape ? paperSize.height : paperSize.width) * MM_TO_PX;
  const canvasHeight = (isLandscape ? paperSize.width : paperSize.height) * MM_TO_PX;

  // Обработка drag
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    onSelectElement(elementId);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const element = template.elements.find(el => el.id === elementId);
    if (!element) return;

    setDragging({
      id: elementId,
      startX: e.clientX,
      startY: e.clientY,
      elemX: element.x,
      elemY: element.y,
    });
  }, [template.elements, onSelectElement]);

  // Обработка resize
  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, corner: string) => {
    e.stopPropagation();
    
    const element = template.elements.find(el => el.id === elementId);
    if (!element) return;

    setResizing({
      id: elementId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      elemW: element.width,
      elemH: element.height,
      elemX: element.x,
      elemY: element.y,
    });
  }, [template.elements]);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / zoom;
        const dy = (e.clientY - dragging.startY) / zoom;
        
        const newX = Math.max(0, Math.min(100, dragging.elemX + (dx / canvasWidth) * 100));
        const newY = Math.max(0, Math.min(100, dragging.elemY + (dy / canvasHeight) * 100));
        
        onUpdateElement(dragging.id, { x: newX, y: newY });
      }
      
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / zoom;
        const dy = (e.clientY - resizing.startY) / zoom;
        
        let newW = resizing.elemW;
        let newH = resizing.elemH;
        let newX = resizing.elemX;
        let newY = resizing.elemY;
        
        const dxPercent = (dx / canvasWidth) * 100;
        const dyPercent = (dy / canvasHeight) * 100;
        
        if (resizing.corner.includes('e')) newW = Math.max(5, resizing.elemW + dxPercent);
        if (resizing.corner.includes('w')) {
          newW = Math.max(5, resizing.elemW - dxPercent);
          newX = resizing.elemX + dxPercent;
        }
        if (resizing.corner.includes('s')) newH = Math.max(3, resizing.elemH + dyPercent);
        if (resizing.corner.includes('n')) {
          newH = Math.max(3, resizing.elemH - dyPercent);
          newY = resizing.elemY + dyPercent;
        }
        
        onUpdateElement(resizing.id, { width: newW, height: newH, x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, zoom, canvasWidth, canvasHeight, onUpdateElement]);

  // Render element content
  const renderElementContent = (element: DesignElement) => {
    if (element.type === 'image') {
      return (
        <img
          src={element.src}
          alt=""
          className="w-full h-full pointer-events-none"
          style={{ objectFit: element.objectFit || 'contain' }}
          draggable={false}
        />
      );
    }

    const content = element.type === 'placeholder' && element.placeholder
      ? PLACEHOLDERS[element.placeholder]?.example || `{{${element.placeholder}}}`
      : element.content || '';

    return (
      <div
        className="w-full h-full flex items-center overflow-hidden pointer-events-none"
        style={{
          fontFamily: `"${element.fontFamily}", sans-serif`,
          fontSize: `${(element.fontSize || 14) * zoom}px`,
          fontWeight: element.fontWeight || 'normal',
          fontStyle: element.fontStyle || 'normal',
          color: element.color || '#000000',
          textAlign: element.textAlign || 'left',
          justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {element.type === 'placeholder' && (
          <span className="opacity-60">{content}</span>
        )}
        {element.type === 'text' && content}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-white shadow-lg"
      style={{
        width: canvasWidth * zoom,
        height: canvasHeight * zoom,
        backgroundColor: template.backgroundColor,
        backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => onSelectElement(null)}
    >
      {/* Elements */}
      {template.elements
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => {
          const isSelected = element.id === selectedElementId;
          
          return (
            <div
              key={element.id}
              className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                zIndex: element.zIndex,
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            >
              {renderElementContent(element)}
              
              {/* Resize handles */}
              {isSelected && (
                <>
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize"
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                  />
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize"
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                  />
                  <div
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize"
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize"
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                  />
                </>
              )}
            </div>
          );
        })}

      {/* Grid overlay (optional, for alignment) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: `${canvasWidth * zoom / 10}px ${canvasHeight * zoom / 10}px`,
        }}
      />
    </div>
  );
}
