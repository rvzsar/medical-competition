/**
 * XSS Protection
 * Санитизация пользовательского ввода
 * 
 * ВАЖНО: Для production рекомендуется использовать DOMPurify
 */

/**
 * Санитизация HTML (для rich text)
 * Использует строгий белый список тегов
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return '';
  
  // Белый список безопасных тегов
  const allowedTags = new Set(['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li']);
  
  let clean = dirty;
  
  // Удаляем script теги и их содержимое
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Удаляем style теги и их содержимое
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Удаляем on* атрибуты (onclick, onload, onerror, etc.)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Удаляем javascript: протокол
  clean = clean.replace(/javascript\s*:/gi, '');
  
  // Удаляем data: протокол (может содержать вредоносный код)
  clean = clean.replace(/data\s*:/gi, '');
  
  // Удаляем vbscript: протокол
  clean = clean.replace(/vbscript\s*:/gi, '');
  
  // Удаляем expression() (IE CSS expression)
  clean = clean.replace(/expression\s*\(/gi, '');
  
  // Удаляем теги не из белого списка (сохраняем содержимое)
  clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    return allowedTags.has(tag.toLowerCase()) ? match.replace(/\s+[a-z-]+\s*=\s*["'][^"']*["']/gi, '') : '';
  });
  
  return clean;
}

/**
 * Санитизация обычного текста
 * Экранирует HTML символы
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Санитизация для использования в атрибутах
 */
export function sanitizeAttribute(value: string): string {
  if (!value) return '';
  
  return value
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
