/**
 * Certificate Design Service
 * 
 * CRUD операции для шаблонов дизайна сертификатов
 */

import { getRedisClient } from '@/lib/redis';
import type { CertificateDesignTemplate } from '@/types/certificate-design';

const DESIGN_KEY_PREFIX = 'cert:design:';

/**
 * Получить шаблон дизайна по ID мероприятия
 */
export async function getDesignTemplate(eventId: string): Promise<CertificateDesignTemplate | null> {
  try {
    const redis = await getRedisClient();
    const data = await redis.get(`${DESIGN_KEY_PREFIX}${eventId}`);
    
    if (!data) return null;
    
    return JSON.parse(data) as CertificateDesignTemplate;
  } catch (error) {
    console.error('Failed to get design template:', error);
    return null;
  }
}

/**
 * Сохранить шаблон дизайна
 */
export async function saveDesignTemplate(template: CertificateDesignTemplate): Promise<void> {
  try {
    const redis = await getRedisClient();
    
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
    
    await redis.set(
      `${DESIGN_KEY_PREFIX}${template.eventId}`,
      JSON.stringify(updatedTemplate)
    );
  } catch (error) {
    console.error('Failed to save design template:', error);
    throw new Error('Не удалось сохранить шаблон');
  }
}

/**
 * Удалить шаблон дизайна
 */
export async function deleteDesignTemplate(eventId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(`${DESIGN_KEY_PREFIX}${eventId}`);
  } catch (error) {
    console.error('Failed to delete design template:', error);
    throw new Error('Не удалось удалить шаблон');
  }
}

/**
 * Получить все шаблоны (для админки)
 */
export async function getAllDesignTemplates(): Promise<CertificateDesignTemplate[]> {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(`${DESIGN_KEY_PREFIX}*`);
    
    if (keys.length === 0) return [];
    
    const templates: CertificateDesignTemplate[] = [];
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        templates.push(JSON.parse(data));
      }
    }
    
    return templates.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get all design templates:', error);
    return [];
  }
}
