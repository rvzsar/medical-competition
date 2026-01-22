'use client';

/**
 * Компонент Breadcrumbs для навигации
 * 
 * Обеспечивает:
 * - Понимание текущего местоположения (Nielsen #6)
 * - Быструю навигацию к родительским разделам
 * - Accessibility (WCAG 2.1)
 */

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav 
      className={`flex items-center text-sm ${className}`}
      aria-label="Навигация по разделам"
    >
      <ol className="flex items-center flex-wrap gap-1">
        {/* Home link */}
        <li className="flex items-center">
          <Link 
            href="/" 
            className="text-gray-500 hover:text-blue-600 transition-colors"
            aria-label="Главная страница"
          >
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* Separator */}
            <svg 
              className="w-4 h-4 text-gray-400 mx-1" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>

            {/* Breadcrumb item */}
            {item.href ? (
              <Link 
                href={item.href}
                className="text-gray-500 hover:text-blue-600 transition-colors max-w-[200px] truncate"
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className="text-gray-900 font-medium max-w-[200px] truncate"
                aria-current="page"
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Хелпер для создания breadcrumbs для страниц мероприятий
 */
export function createEventBreadcrumbs(
  eventId: string,
  eventName: string,
  additionalItems: BreadcrumbItem[] = []
): BreadcrumbItem[] {
  return [
    { label: 'Мероприятия', href: '/admin' },
    { label: eventName, href: `/admin/events/${eventId}` },
    ...additionalItems,
  ];
}

/**
 * Хелпер для создания breadcrumbs для страниц конкурсов
 */
export function createContestBreadcrumbs(
  eventId: string,
  eventName: string,
  contestName: string,
  contestId?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Мероприятия', href: '/admin' },
    { label: eventName, href: `/admin/events/${eventId}` },
  ];

  if (contestId) {
    items.push({ label: contestName });
  } else {
    items.push({ label: 'Новый конкурс' });
  }

  return items;
}
