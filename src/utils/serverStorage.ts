import { JuryMember, TeamScore, AggregatedScore, Team } from "@/types";

const API_BASE = '/api/data';

export const serverStorageUtils = {
  // Работа с текущим членом жюри (оставляем в localStorage)
  getCurrentJury(): JuryMember | null {
    if (typeof window === 'undefined') return null;
    const juryData = localStorage.getItem('currentJury');
    return juryData ? JSON.parse(juryData) : null;
  },

  setCurrentJury(jury: JuryMember): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('currentJury', JSON.stringify(jury));
  },

  clearCurrentJury(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('currentJury');
  },

  // Работа с командами (серверное хранилище)
  async getTeams(): Promise<Team[]> {
    try {
      const response = await fetch(`${API_BASE}?type=teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  },

  async setTeams(teams: Team[]): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'teams', data: teams }),
      });
      if (!response.ok) throw new Error('Failed to save teams');
    } catch (error) {
      console.error('Error saving teams:', error);
    }
  },

  async addTeam(team: Team): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'addTeam', data: team }),
      });
      if (!response.ok) throw new Error('Failed to add team');
    } catch (error) {
      console.error('Error adding team:', error);
    }
  },

  async updateTeam(team: Team): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'updateTeam', data: team }),
      });
      if (!response.ok) throw new Error('Failed to update team');
    } catch (error) {
      console.error('Error updating team:', error);
    }
  },

  async deleteTeam(teamId: string): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'deleteTeam', data: teamId }),
      });
      if (!response.ok) throw new Error('Failed to delete team');
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  },

  // Работа с оценками команд (серверное хранилище)
  async getTeamScores(): Promise<TeamScore[]> {
    try {
      const response = await fetch(`${API_BASE}?type=teamScores`);
      if (!response.ok) throw new Error('Failed to fetch team scores');
      return await response.json();
    } catch (error) {
      console.error('Error fetching team scores:', error);
      return [];
    }
  },

  async setTeamScores(scores: TeamScore[]): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'teamScores', data: scores }),
      });
      if (!response.ok) throw new Error('Failed to save team scores');
    } catch (error) {
      console.error('Error saving team scores:', error);
    }
  },

  async addTeamScore(score: TeamScore): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'addTeamScore', data: score }),
      });
      if (!response.ok) {
        let message = 'Failed to add team score';
        try {
          const data = await response.json();
          if (data && typeof data === 'object' && 'error' in data && data.error) {
            message = String(data.error);
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }
      
      // Проверяем, что данные сохранились корректно
      await this.verifyDataIntegrity(score);
    } catch (error) {
      console.error('Error adding team score:', error);
      throw error;
    }
  },

  // Проверка целостности данных
  async verifyDataIntegrity(score: TeamScore): Promise<void> {
    try {
      // Проверяем, что оценка сохранилась
      const savedScores = await this.getTeamScores();
      const savedScore = savedScores.find(
        s => s.teamId === score.teamId &&
             s.contestId === score.contestId &&
             s.juryId === score.juryId
      );
      
      if (!savedScore || savedScore.score !== score.score) {
        console.warn('Обнаружена проблема с сохранением оценки');
        throw new Error('Score verification failed');
      }
    } catch (error) {
      console.warn('Ошибка при проверке целостности данных:', error);
      throw error;
    }
  },

  // Работа с агрегированными оценками (серверное хранилище)
  async getAggregatedScores(): Promise<AggregatedScore[]> {
    try {
      const response = await fetch(`${API_BASE}?type=aggregatedScores`);
      if (!response.ok) throw new Error('Failed to fetch aggregated scores');
      return await response.json();
    } catch (error) {
      console.error('Error fetching aggregated scores:', error);
      return [];
    }
  },

  async setAggregatedScores(scores: AggregatedScore[]): Promise<void> {
    // Агрегированные оценки обновляются на сервере автоматически
    console.log('Aggregated scores are updated automatically on server; received', scores.length, 'items');
  },

  // Получение агрегированной оценки для команды и конкурса
  async getAggregatedScore(teamId: string, contestId: string): Promise<number> {
    try {
      const aggregatedScores = await this.getAggregatedScores();
      const score = aggregatedScores.find(s => s.teamId === teamId && s.contestId === contestId);
      return score ? score.averageScore : 0;
    } catch (error) {
      console.error('Error getting aggregated score:', error);
      return 0;
    }
  },

  // Получение общего балла команды
  async getTeamTotalScore(teamId: string): Promise<number> {
    try {
      const aggregatedScores = await this.getAggregatedScores();
      const teamScores = aggregatedScores.filter(s => s.teamId === teamId);
      return teamScores.reduce((total, score) => total + score.averageScore, 0);
    } catch (error) {
      console.error('Error getting team total score:', error);
      return 0;
    }
  },

  // Экспорт данных для резервного копирования
  async exportData(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}?type=all`);
      if (!response.ok) throw new Error('Failed to export data');
      const data = await response.json();
      return JSON.stringify({
        ...data,
        exportDate: new Date().toISOString()
      }, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  },

  // Импорт данных из резервной копии
  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.teams) {
        await this.setTeams(data.teams);
      }
      if (data.scores) {
        await this.setTeamScores(data.scores);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Обновление агрегированных оценок (выполняется на сервере)
  async updateAggregatedScores(): Promise<void> {
    // Агрегированные оценки обновляются автоматически на сервере
    console.log('Aggregated scores are updated automatically on server');
  }
};

// Для обратной совместимости оставляем оригинальный объект
export const storageUtils = serverStorageUtils;