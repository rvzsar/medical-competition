/**
 * API Route: Upload Certificate Image
 * 
 * Загрузка изображений для конструктора сертификатов в Vercel Blob
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { checkApiAuth } from '@/lib/api-auth';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

export async function POST(request: NextRequest) {
  // Проверка авторизации
  const authResult = checkApiAuth(request, ['Admin', 'Event_Manager']);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'logo' or 'background'

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Проверка типа файла
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Недопустимый тип файла. Разрешены: PNG, JPG, SVG, WebP' },
        { status: 400 }
      );
    }

    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Генерация уникального имени
    const ext = file.name.split('.').pop() || 'png';
    const folder = type === 'background' ? 'backgrounds' : 'logos';
    const filename = `certificates/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Загрузка в Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки изображения' },
      { status: 500 }
    );
  }
}
