import type { JuryMember } from '@/types';

export const JURY_MEMBERS: JuryMember[] = [
  {
    id: '1',
    firstName: 'Александр',
    lastName: 'Завалко',
    middleName: 'Федорович',
    title: 'д.м.н., доцент, заведующий кафедрой акушерства, гинекологии и педиатрии',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    firstName: 'Анна',
    lastName: 'Лысова',
    middleName: 'Николаевна',
    title: 'к.м.н., доцент кафедры акушерства и гинекологии',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    firstName: 'Наталия',
    lastName: 'Портянникова',
    middleName: 'Петровна',
    title: 'к.м.н., доцент кафедры акушерства и гинекологии с курсом эндоскопической хирургии и симуляционно-тренингового обучения',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    firstName: 'Владимир',
    lastName: 'Никаноров',
    middleName: 'Николаевич',
    title: 'к.м.н., доцент кафедры акушерства и гинекологии с курсом эндоскопической хирургии и симуляционно-тренингового обучения',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    firstName: 'Елена',
    lastName: 'Асеева',
    middleName: 'Владимировна',
    title: 'к.м.н., доцент, декан лечебного факультета',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

/**
 * Получить полное имя члена жюри
 */
export function getJuryFullName(jury: JuryMember): string {
  return `${jury.lastName} ${jury.firstName}${jury.middleName ? ' ' + jury.middleName : ''}`;
}
