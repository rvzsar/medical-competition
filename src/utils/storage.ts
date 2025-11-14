import { JuryMember, TeamScore, AggregatedScore, Team } from "@/types";
import { JURY_MEMBERS } from "@/config/juryMembers";

type ScoreBackup = TeamScore & {
  timestamp: number;
  backupId: string;
};

const STORAGE_KEYS = {
  CURRENT_JURY: 'currentJury',
  TEAMS: 'teams',
  TEAM_SCORES: 'teamScores',
  AGGREGATED_SCORES: 'aggregatedScores'
};

export const storageUtils = {
  // Работа с текущим членом жюри
  getCurrentJury(): JuryMember | null {
    if (typeof window === 'undefined') return null;
    const juryData = localStorage.getItem(STORAGE_KEYS.CURRENT_JURY);
    return juryData ? JSON.parse(juryData) : null;
  },

  setCurrentJury(jury: JuryMember): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_JURY, JSON.stringify(jury));
  },

  clearCurrentJury(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_JURY);
  },

  // Работа с командами
  getTeams(): Team[] {
    if (typeof window === 'undefined') return [];
    const teamsData = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return teamsData ? JSON.parse(teamsData) : [];
  },

  setTeams(teams: Team[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  },

  // Работа с оценками команд
  getTeamScores(): TeamScore[] {
    if (typeof window === 'undefined') return [];
    const scoresData = localStorage.getItem(STORAGE_KEYS.TEAM_SCORES);
    return scoresData ? JSON.parse(scoresData) : [];
  },

  setTeamScores(scores: TeamScore[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TEAM_SCORES, JSON.stringify(scores));
  },

  addTeamScore(score: TeamScore): void {
    const scores = this.getTeamScores();
    const existingIndex = scores.findIndex(
      s => s.teamId === score.teamId && s.contestId === score.contestId && s.juryId === score.juryId
    );
    
    if (existingIndex >= 0) {
      scores[existingIndex] = score;
    } else {
      scores.push(score);
    }
    
    // Сохраняем с дополнительной проверкой
    this.setTeamScores(scores);
    
    // Делаем резервную копию
    this.createBackup(score);
    
    // Обновляем агрегированные оценки
    this.updateAggregatedScores();
    
    // Проверяем, что данные сохранились корректно
    this.verifyDataIntegrity(score);
  },

  // Создание резервной копии оценки
  createBackup(score: TeamScore): void {
    try {
      const backups = this.getBackups();
      const backupKey = `${score.teamId}_${score.contestId}_${score.juryId}_${Date.now()}`;
      backups[backupKey] = {
        ...score,
        timestamp: Date.now(),
        backupId: backupKey,
      };
      localStorage.setItem('competition_backups', JSON.stringify(backups));
      
      // Удаляем старые бэкапы (оставляем последние 50)
      const backupEntries = Object.entries(backups);
      if (backupEntries.length > 50) {
        const sortedEntries = backupEntries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        const toKeep = sortedEntries.slice(-50);
        const newBackups = Object.fromEntries(toKeep);
        localStorage.setItem('competition_backups', JSON.stringify(newBackups));
      }
    } catch (error) {
      console.warn('Не удалось создать резервную копию:', error);
    }
  },

  // Получение резервных копий
  getBackups(): Record<string, ScoreBackup> {
    try {
      const backupsData = localStorage.getItem('competition_backups');
      return backupsData ? JSON.parse(backupsData) : {};
    } catch {
      return {};
    }
  },

  // Проверка целостности данных
  verifyDataIntegrity(score: TeamScore): void {
    try {
      // Проверяем, что оценка сохранилась
      const savedScores = this.getTeamScores();
      const savedScore = savedScores.find(
        s => s.teamId === score.teamId &&
             s.contestId === score.contestId &&
             s.juryId === score.juryId
      );
      
      if (!savedScore || savedScore.score !== score.score) {
        console.warn('Обнаружена проблема с сохранением оценки, пытаемся восстановить...');
        // Если есть проблема, пробуем восстановить из бэкапа
        this.restoreFromBackup(score);
      }
    } catch (error) {
      console.warn('Ошибка при проверке целостности данных:', error);
    }
  },

  // Восстановление из резервной копии
  restoreFromBackup(originalScore: TeamScore): void {
    try {
      const backups = this.getBackups();
      const backupKey = Object.keys(backups).find(key =>
        key.includes(`${originalScore.teamId}_${originalScore.contestId}_${originalScore.juryId}`)
      );
      
      if (backupKey && backups[backupKey]) {
        const scores = this.getTeamScores();
        const existingIndex = scores.findIndex(
          s => s.teamId === originalScore.teamId &&
               s.contestId === originalScore.contestId &&
               s.juryId === originalScore.juryId
        );
        
        if (existingIndex >= 0) {
          scores[existingIndex] = backups[backupKey];
        } else {
          scores.push(backups[backupKey]);
        }
        
        this.setTeamScores(scores);
        this.updateAggregatedScores();
        console.log('Оценка успешно восстановлена из резервной копии');
      }
    } catch (error) {
      console.warn('Не удалось восстановить из резервной копии:', error);
    }
  },

  // Экспорт данных для резервного копирования
  exportData(): string {
    try {
      const data = {
        teams: this.getTeams(),
        scores: this.getTeamScores(),
        aggregatedScores: this.getAggregatedScores(),
        backups: this.getBackups(),
        exportDate: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.warn('Ошибка при экспорте данных:', error);
      return '';
    }
  },

  // Импорт данных из резервной копии
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.teams) this.setTeams(data.teams);
      if (data.scores) this.setTeamScores(data.scores);
      if (data.aggregatedScores) this.setAggregatedScores(data.aggregatedScores);
      if (data.backups) localStorage.setItem('competition_backups', JSON.stringify(data.backups));
      return true;
    } catch (error) {
      console.warn('Ошибка при импорте данных:', error);
      return false;
    }
  },

  // Работа с агрегированными оценками
  getAggregatedScores(): AggregatedScore[] {
    if (typeof window === 'undefined') return [];
    const scoresData = localStorage.getItem(STORAGE_KEYS.AGGREGATED_SCORES);
    return scoresData ? JSON.parse(scoresData) : [];
  },

  setAggregatedScores(scores: AggregatedScore[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AGGREGATED_SCORES, JSON.stringify(scores));
  },

  updateAggregatedScores(): void {
    const teamScores = this.getTeamScores();
    const teams = this.getTeams();
    const juryMembers: JuryMember[] = JURY_MEMBERS;

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
            averageScore: Math.round(averageScore * 10) / 10, // Округляем до 1 знака после запятой
            juryScores,
            completedAt: new Date()
          });
        }
      });
    });

    this.setAggregatedScores(aggregatedScores);
  },

  // Получение агрегированной оценки для команды и конкурса
  getAggregatedScore(teamId: string, contestId: string): number {
    const aggregatedScores = this.getAggregatedScores();
    const score = aggregatedScores.find(s => s.teamId === teamId && s.contestId === contestId);
    return score ? score.averageScore : 0;
  },

  // Получение общего балла команды
  getTeamTotalScore(teamId: string): number {
    const aggregatedScores = this.getAggregatedScores();
    const teamScores = aggregatedScores.filter(s => s.teamId === teamId);
    return teamScores.reduce((total, score) => total + score.averageScore, 0);
  }
};