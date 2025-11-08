import { kv } from '@vercel/kv';
import { Team, TeamScore, AggregatedScore, JuryMember } from '@/types';

// Ключи для хранения данных в KV
const KEYS = {
  TEAMS: 'medical-competition:teams',
  TEAM_SCORES: 'medical-competition:team-scores',
  AGGREGATED_SCORES: 'medical-competition:aggregated-scores',
  JURY_MEMBERS: 'medical-competition:jury-members'
};

// Члены жюри (константы)
const juryMembers: JuryMember[] = [
  { id: "1", name: "Завалко Александр Федорович", title: "", isActive: true },
  { id: "2", name: "Столяров Сергей Анатольевич", title: "", isActive: true },
  { id: "3", name: "Портянникова Наталия Петровна", title: "", isActive: true },
  { id: "4", name: "Никаноров Владимир Николаевич", title: "", isActive: true },
  { id: "5", name: "Ишутов Игорь Валерьевич", title: "", isActive: true },
  { id: "6", name: "Асеева Елена Владимировна", title: "", isActive: true },
];

// Инициализация данных по умолчанию
async function initializeDefaultData() {
  const existingTeams = await kv.get<Team[]>(KEYS.TEAMS);
  
  if (!existingTeams) {
    const defaultTeams: Team[] = [
      { id: "1", name: "Команда А", members: ["Иванов", "Петров", "Сидоров"], totalScore: 0 },
      { id: "2", name: "Команда Б", members: ["Козлов", "Николаев", "Михайлов"], totalScore: 0 },
      { id: "3", name: "Команда В", members: ["Александров", "Дмитриев", "Федоров"], totalScore: 0 },
    ];
    
    await kv.set(KEYS.TEAMS, defaultTeams);
    await kv.set(KEYS.TEAM_SCORES, []);
    await kv.set(KEYS.AGGREGATED_SCORES, []);
    await kv.set(KEYS.JURY_MEMBERS, juryMembers);
    
    return {
      teams: defaultTeams,
      teamScores: [],
      aggregatedScores: []
    };
  }
  
  return {
    teams: existingTeams,
    teamScores: await kv.get<TeamScore[]>(KEYS.TEAM_SCORES) || [],
    aggregatedScores: await kv.get<AggregatedScore[]>(KEYS.AGGREGATED_SCORES) || []
  };
}

// Функция для обновления агрегированных оценок
async function updateAggregatedScores() {
  const teams = await kv.get<Team[]>(KEYS.TEAMS) || [];
  const teamScores = await kv.get<TeamScore[]>(KEYS.TEAM_SCORES) || [];
  
  const aggregatedScores: AggregatedScore[] = [];

  teams.forEach(team => {
    ['visit-card', 'clinical-case', 'practical-skills', 'mind-battle', 'jury-question'].forEach(contestId => {
      const contestScores = teamScores.filter(
        s => s.teamId === team.id && s.contestId === contestId
      );

      if (contestScores.length > 0) {
        const juryScores = contestScores.map(score => {
          const jury = juryMembers.find(j => j.id === score.juryId);
          return {
            juryId: score.juryId,
            juryName: jury?.name || 'Неизвестный жюри',
            score: score.score
          };
        });

        const averageScore = juryScores.reduce((sum, js) => sum + js.score, 0) / juryScores.length;

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

  await kv.set(KEYS.AGGREGATED_SCORES, aggregatedScores);
  return aggregatedScores;
}

// Получение всех данных
export async function getAllData() {
  await initializeDefaultData();
  
  return {
    teams: await kv.get<Team[]>(KEYS.TEAMS) || [],
    teamScores: await kv.get<TeamScore[]>(KEYS.TEAM_SCORES) || [],
    aggregatedScores: await kv.get<AggregatedScore[]>(KEYS.AGGREGATED_SCORES) || []
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
  
  await kv.set(KEYS.TEAM_SCORES, teamScores);
  await updateAggregatedScores();
  
  return await getAllData();
}

// Добавление команды
export async function addTeam(team: Team) {
  const teams = await getTeams();
  teams.push(team);
  await kv.set(KEYS.TEAMS, teams);
  
  return await getAllData();
}

// Обновление команды
export async function updateTeam(updatedTeam: Team) {
  const teams = await getTeams();
  const teamIndex = teams.findIndex(t => t.id === updatedTeam.id);
  
  if (teamIndex >= 0) {
    teams[teamIndex] = updatedTeam;
    await kv.set(KEYS.TEAMS, teams);
  }
  
  return await getAllData();
}

// Удаление команды
export async function deleteTeam(teamId: string) {
  const teams = await getTeams();
  const teamScores = await getTeamScores();
  
  const filteredTeams = teams.filter(t => t.id !== teamId);
  const filteredScores = teamScores.filter(s => s.teamId !== teamId);
  
  await kv.set(KEYS.TEAMS, filteredTeams);
  await kv.set(KEYS.TEAM_SCORES, filteredScores);
  await updateAggregatedScores();
  
  return await getAllData();
}

// Очистка всех оценок
export async function clearAllScores() {
  await kv.set(KEYS.TEAM_SCORES, []);
  await updateAggregatedScores();
  
  return await getAllData();
}

// Резервное копирование данных
export async function backupData() {
  const data = await getAllData();
  const timestamp = new Date().toISOString();
  const backupKey = `medical-competition:backup:${timestamp}`;
  
  await kv.set(backupKey, data);
  return { success: true, backupKey, timestamp };
}

// Восстановление данных из резервной копии
export async function restoreData(backupKey: string) {
  const backupData = await kv.get<any>(backupKey);
  
  if (backupData && backupData.teams) {
    await kv.set(KEYS.TEAMS, backupData.teams);
    await kv.set(KEYS.TEAM_SCORES, backupData.teamScores);
    await kv.set(KEYS.AGGREGATED_SCORES, backupData.aggregatedScores);
    
    return { success: true, data: backupData };
  }
  
  return { success: false, error: 'Backup not found' };
}

// Получение списка резервных копий
export async function getBackupList() {
  const keys = await kv.keys('medical-competition:backup:*');
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
  await kv.set(KEYS.TEAMS, teams);
  await updateAggregatedScores();
  return await getAllData();
}

// Прямое обновление всех оценок (для совместимости)
export async function updateAllTeamScores(teamScores: TeamScore[]) {
  await kv.set(KEYS.TEAM_SCORES, teamScores);
  await updateAggregatedScores();
  return await getAllData();
}