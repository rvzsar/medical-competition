import { createClient, RedisClientType } from 'redis';
import { Team, TeamScore, AggregatedScore, JuryMember } from '@/types';
import { CertificateTemplatesConfig } from '@/types/certificate';
import { JURY_MEMBERS } from '@/config/juryMembers';

// Ключи для хранения данных в Redis
const KEYS = {
  TEAMS: 'medical-competition:teams',
  TEAM_SCORES: 'medical-competition:team-scores',
  AGGREGATED_SCORES: 'medical-competition:aggregated-scores',
  JURY_MEMBERS: 'medical-competition:jury-members',
  CERTIFICATE_TEMPLATES: 'medical-competition:certificate-templates',
  SCORES_LOCK: 'medical-competition:scores-lock',
};

// Члены жюри (общая конфигурация)
const juryMembers: JuryMember[] = JURY_MEMBERS;

// Создание Redis клиента
let redisClient: RedisClientType | null = null;

async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

// Инициализация данных по умолчанию
async function initializeDefaultData() {
  const client = await getRedisClient();
  const existingTeams = await client.get(KEYS.TEAMS);
  
  if (!existingTeams) {
    const defaultTeams: Team[] = [
      { id: "1", name: "Команда А", members: ["Иванов", "Петров", "Сидоров"], totalScore: 0 },
      { id: "2", name: "Команда Б", members: ["Козлов", "Николаев", "Михайлов"], totalScore: 0 },
      { id: "3", name: "Команда В", members: ["Александров", "Дмитриев", "Федоров"], totalScore: 0 },
    ];
    
    await client.set(KEYS.TEAMS, JSON.stringify(defaultTeams));
    await client.set(KEYS.TEAM_SCORES, JSON.stringify([]));
    await client.set(KEYS.AGGREGATED_SCORES, JSON.stringify([]));
    await client.set(KEYS.JURY_MEMBERS, JSON.stringify(juryMembers));
    
    return {
      teams: defaultTeams,
      teamScores: [],
      aggregatedScores: []
    };
  }
  
  return {
    teams: JSON.parse(existingTeams),
    teamScores: JSON.parse(await client.get(KEYS.TEAM_SCORES) || '[]'),
    aggregatedScores: JSON.parse(await client.get(KEYS.AGGREGATED_SCORES) || '[]')
  };
}

// Функция для обновления агрегированных оценок
async function updateAggregatedScores() {
  const client = await getRedisClient();
  const teams = JSON.parse(await client.get(KEYS.TEAMS) || '[]');
  const teamScores = JSON.parse(await client.get(KEYS.TEAM_SCORES) || '[]');
  
  const aggregatedScores: AggregatedScore[] = [];

  teams.forEach((team: Team) => {
    ['visit-card', 'clinical-case', 'practical-skills', 'mind-battle', 'jury-question'].forEach(contestId => {
      const contestScores = teamScores.filter(
        (s: TeamScore) => s.teamId === team.id && s.contestId === contestId
      );

      if (contestScores.length > 0) {
        const juryScores = contestScores.map((score: TeamScore) => {
          const jury = juryMembers.find(j => j.id === score.juryId);
          return {
            juryId: score.juryId,
            juryName: jury?.name || 'Неизвестный жюри',
            score: score.score
          };
        });

        const averageScore =
          juryScores.reduce((sum: number, js: { score: number }) => sum + js.score, 0) /
          juryScores.length;

        aggregatedScores.push({
          teamId: team.id,
          contestId,
          averageScore: Math.round(averageScore * 10) / 10,
          juryScores,
          completedAt: new Date()
        });
      }
    });
  });

  await client.set(KEYS.AGGREGATED_SCORES, JSON.stringify(aggregatedScores));
  return aggregatedScores;
}

// Получение всех данных
export async function getAllData() {
  await initializeDefaultData();
  
  const client = await getRedisClient();
  return {
    teams: JSON.parse(await client.get(KEYS.TEAMS) || '[]'),
    teamScores: JSON.parse(await client.get(KEYS.TEAM_SCORES) || '[]'),
    aggregatedScores: JSON.parse(await client.get(KEYS.AGGREGATED_SCORES) || '[]')
  };
}

// Получение команд
export async function getTeams(): Promise<Team[]> {
  const data = await getAllData();
  return data.teams;
}

// Получение оценок команд
export async function getTeamScores(): Promise<TeamScore[]> {
  const data = await getAllData();
  return data.teamScores;
}

// Получение агрегированных оценок
export async function getAggregatedScores(): Promise<AggregatedScore[]> {
  const data = await getAllData();
  return data.aggregatedScores;
}

// Получение членов жюри
export async function getJuryMembers(): Promise<JuryMember[]> {
  return juryMembers;
}

// Добавление оценки команды
export async function addTeamScore(score: TeamScore) {
  const lockState = await getScoresLockState();
  if (lockState.locked) {
    throw new Error('Изменение оценок заблокировано организатором');
  }
  const client = await getRedisClient();
  const teamScores = await getTeamScores();
  const existingIndex = teamScores.findIndex(
    s => s.teamId === score.teamId && 
         s.contestId === score.contestId && 
         s.juryId === score.juryId
  );
  
  if (existingIndex >= 0) {
    teamScores[existingIndex] = score;
  } else {
    teamScores.push(score);
  }
  
  await client.set(KEYS.TEAM_SCORES, JSON.stringify(teamScores));
  await updateAggregatedScores();
  
  return await getAllData();
}

// Добавление команды
export async function addTeam(team: Team) {
  const client = await getRedisClient();
  const teams = await getTeams();
  teams.push(team);
  await client.set(KEYS.TEAMS, JSON.stringify(teams));
  
  return await getAllData();
}

// Обновление команды
export async function updateTeam(updatedTeam: Team) {
  const client = await getRedisClient();
  const teams = await getTeams();
  const teamIndex = teams.findIndex(t => t.id === updatedTeam.id);
  
  if (teamIndex >= 0) {
    teams[teamIndex] = updatedTeam;
    await client.set(KEYS.TEAMS, JSON.stringify(teams));
  }
  
  return await getAllData();
}

// Удаление команды
export async function deleteTeam(teamId: string) {
  const client = await getRedisClient();
  const teams = await getTeams();
  const teamScores = await getTeamScores();
  
  const filteredTeams = teams.filter(t => t.id !== teamId);
  const filteredScores = teamScores.filter(s => s.teamId !== teamId);
  
  await client.set(KEYS.TEAMS, JSON.stringify(filteredTeams));
  await client.set(KEYS.TEAM_SCORES, JSON.stringify(filteredScores));
  await updateAggregatedScores();
  
  return await getAllData();
}

// Очистка всех оценок
export async function clearAllScores() {
  const client = await getRedisClient();
  await client.set(KEYS.TEAM_SCORES, JSON.stringify([]));
  await updateAggregatedScores();
  
  return await getAllData();
}

// Очистка оценок конкретного члена жюри (옵ционально по конкурсу)
export async function clearJuryScores(juryId: string, contestId?: string) {
  const client = await getRedisClient();
  const teamScores = await getTeamScores();

  const filteredScores = teamScores.filter((score) => {
    if (!contestId) {
      return score.juryId !== juryId;
    }
    return !(score.juryId === juryId && score.contestId === contestId);
  });

  await client.set(KEYS.TEAM_SCORES, JSON.stringify(filteredScores));
  await updateAggregatedScores();

  return await getAllData();
}

// Резервное копирование данных
export async function backupData() {
  const data = await getAllData();
  const timestamp = new Date().toISOString();
  const backupKey = `medical-competition:backup:${timestamp}`;
  
  const client = await getRedisClient();
  await client.set(backupKey, JSON.stringify(data));
  return { success: true, backupKey, timestamp };
}

// Восстановление данных из резервной копии
export async function restoreData(backupKey: string) {
  const client = await getRedisClient();
  const backupData = JSON.parse(await client.get(backupKey) || '{}');
  
  if (backupData.teams) {
    await client.set(KEYS.TEAMS, JSON.stringify(backupData.teams));
    await client.set(KEYS.TEAM_SCORES, JSON.stringify(backupData.teamScores));
    await client.set(KEYS.AGGREGATED_SCORES, JSON.stringify(backupData.aggregatedScores));
    
    return { success: true, data: backupData };
  }
  
  return { success: false, error: 'Backup not found' };
}

// Получение списка резервных копий
export async function getBackupList() {
  const client = await getRedisClient();
  const keys = await client.keys('medical-competition:backup:*');
  const backups = [];
  
  for (const key of keys) {
    const timestamp = key.split(':').pop();
    backups.push({
      key,
      timestamp: timestamp || '',
      date: new Date(timestamp || '')
    });
  }
  
  return backups.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });
}

// Прямое обновление всех команд (для совместимости)
export async function updateAllTeams(teams: Team[]) {
  const client = await getRedisClient();
  await client.set(KEYS.TEAMS, JSON.stringify(teams));
  await updateAggregatedScores();
  return await getAllData();
}

// Прямое обновление всех оценок (для совместимости)
export async function updateAllTeamScores(teamScores: TeamScore[]) {
  const client = await getRedisClient();
  await client.set(KEYS.TEAM_SCORES, JSON.stringify(teamScores));
  await updateAggregatedScores();
  return await getAllData();
}

export interface ScoresLockState {
  locked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
}

async function getScoresLockState(): Promise<ScoresLockState> {
  const client = await getRedisClient();
  const raw = await client.get(KEYS.SCORES_LOCK);

  if (!raw) {
    return { locked: false, lockedAt: null, lockedBy: null };
  }

  try {
    const parsed = JSON.parse(raw) as ScoresLockState;
    return {
      locked: !!parsed.locked,
      lockedAt: parsed.lockedAt || null,
      lockedBy: parsed.lockedBy || null,
    };
  } catch {
    return { locked: false, lockedAt: null, lockedBy: null };
  }
}

export async function setScoresLocked(locked: boolean, lockedBy: string | null): Promise<ScoresLockState> {
  const client = await getRedisClient();
  const state: ScoresLockState = {
    locked,
    lockedAt: locked ? new Date().toISOString() : null,
    lockedBy,
  };

  await client.set(KEYS.SCORES_LOCK, JSON.stringify(state));
  return state;
}

export async function getScoresLockStatus(): Promise<ScoresLockState> {
  return getScoresLockState();
}

// Закрытие соединения (для cleanup)
export async function closeRedisConnection() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

const DEFAULT_CERTIFICATE_TEMPLATES: CertificateTemplatesConfig = {
  email: {
    subject: 'Сертификат участника – {{eventName}}',
    greeting: 'Здравствуйте, {{recipientName}}!',
    bodyTeam:
      'Ваша команда {{teamName}} приняла участие в мероприятии "{{eventName}}" и показала достойные результаты.',
    bodyIndividual:
      'Вы приняли участие в мероприятии "{{eventName}}" и продемонстрировали высокий уровень знаний и практических навыков.',
    footer:
      'С уважением,\n{{organizerName}}\n{{organizerTitle}}\n{{eventName}}',
  },
  pdf: {
    teamTitle: 'СЕРТИФИКАТ',
    teamIntro: 'Настоящий сертификат подтверждает, что команда',
    individualTitle: 'ИМЕННОЙ СЕРТИФИКАТ',
    individualIntro: 'Настоящий сертификат выдан',
  },
};

export async function getCertificateTemplates(): Promise<CertificateTemplatesConfig> {
  const client = await getRedisClient();
  const raw = await client.get(KEYS.CERTIFICATE_TEMPLATES);

  if (!raw) {
    return DEFAULT_CERTIFICATE_TEMPLATES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CertificateTemplatesConfig>;

    return {
      email: {
        subject: parsed.email?.subject || DEFAULT_CERTIFICATE_TEMPLATES.email.subject,
        greeting: parsed.email?.greeting || DEFAULT_CERTIFICATE_TEMPLATES.email.greeting,
        bodyTeam: parsed.email?.bodyTeam || DEFAULT_CERTIFICATE_TEMPLATES.email.bodyTeam,
        bodyIndividual:
          parsed.email?.bodyIndividual || DEFAULT_CERTIFICATE_TEMPLATES.email.bodyIndividual,
        footer: parsed.email?.footer || DEFAULT_CERTIFICATE_TEMPLATES.email.footer,
      },
      pdf: {
        teamTitle: parsed.pdf?.teamTitle || DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamTitle,
        teamIntro: parsed.pdf?.teamIntro || DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamIntro,
        individualTitle:
          parsed.pdf?.individualTitle || DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualTitle,
        individualIntro:
          parsed.pdf?.individualIntro || DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualIntro,
      },
    };
  } catch {
    return DEFAULT_CERTIFICATE_TEMPLATES;
  }
}

export async function saveCertificateTemplates(
  templates: CertificateTemplatesConfig,
): Promise<CertificateTemplatesConfig> {
  const client = await getRedisClient();

  const sanitized: CertificateTemplatesConfig = {
    email: {
      subject: templates.email.subject?.toString().slice(0, 300) || DEFAULT_CERTIFICATE_TEMPLATES.email.subject,
      greeting:
        templates.email.greeting?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.greeting,
      bodyTeam:
        templates.email.bodyTeam?.toString().slice(0, 1000) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.bodyTeam,
      bodyIndividual:
        templates.email.bodyIndividual?.toString().slice(0, 1000) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.bodyIndividual,
      footer:
        templates.email.footer?.toString().slice(0, 500) ||
        DEFAULT_CERTIFICATE_TEMPLATES.email.footer,
    },
    pdf: {
      teamTitle:
        templates.pdf.teamTitle?.toString().slice(0, 100) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamTitle,
      teamIntro:
        templates.pdf.teamIntro?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.teamIntro,
      individualTitle:
        templates.pdf.individualTitle?.toString().slice(0, 100) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualTitle,
      individualIntro:
        templates.pdf.individualIntro?.toString().slice(0, 300) ||
        DEFAULT_CERTIFICATE_TEMPLATES.pdf.individualIntro,
    },
  };

  await client.set(KEYS.CERTIFICATE_TEMPLATES, JSON.stringify(sanitized));
  return sanitized;
}