import { NextRequest, NextResponse } from 'next/server';
import { Team, TeamScore, AggregatedScore, JuryMember } from '@/types';

// Простое серверное хранилище в памяти
// В реальном приложении здесь должна быть база данных
let serverData: {
  teams: Team[];
  teamScores: TeamScore[];
  aggregatedScores: AggregatedScore[];
} = {
  teams: [
    { id: "1", name: "Команда А", members: ["Иванов", "Петров", "Сидоров"], totalScore: 0 },
    { id: "2", name: "Команда Б", members: ["Козлов", "Николаев", "Михайлов"], totalScore: 0 },
    { id: "3", name: "Команда В", members: ["Александров", "Дмитриев", "Федоров"], totalScore: 0 },
  ],
  teamScores: [],
  aggregatedScores: []
};

const juryMembers: JuryMember[] = [
  { id: "1", name: "Завалко Александр Федорович", title: "", isActive: true },
  { id: "2", name: "Столяров Сергей Анатольевич", title: "", isActive: true },
  { id: "3", name: "Портянникова Наталия Петровна", title: "", isActive: true },
  { id: "4", name: "Никаноров Владимир Николаевич", title: "", isActive: true },
  { id: "5", name: "Ишутов Игорь Валерьевич", title: "", isActive: true },
  { id: "6", name: "Асеева Елена Владимировна", title: "", isActive: true },
];

// Функция для обновления агрегированных оценок
function updateAggregatedScores() {
  const aggregatedScores: AggregatedScore[] = [];

  serverData.teams.forEach(team => {
    ['visit-card', 'clinical-case', 'practical-skills', 'mind-battle', 'jury-question'].forEach(contestId => {
      const contestScores = serverData.teamScores.filter(
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

  serverData.aggregatedScores = aggregatedScores;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'teams':
        return NextResponse.json(serverData.teams);
      
      case 'teamScores':
        return NextResponse.json(serverData.teamScores);
      
      case 'aggregatedScores':
        return NextResponse.json(serverData.aggregatedScores);
      
      case 'all':
        return NextResponse.json(serverData);
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'teams':
        serverData.teams = data;
        break;
      
      case 'teamScores':
        serverData.teamScores = data;
        updateAggregatedScores();
        break;
      
      case 'addTeamScore':
        const newScore: TeamScore = data;
        const existingIndex = serverData.teamScores.findIndex(
          s => s.teamId === newScore.teamId && 
               s.contestId === newScore.contestId && 
               s.juryId === newScore.juryId
        );
        
        if (existingIndex >= 0) {
          serverData.teamScores[existingIndex] = newScore;
        } else {
          serverData.teamScores.push(newScore);
        }
        updateAggregatedScores();
        break;
      
      case 'addTeam':
        const newTeam: Team = data;
        serverData.teams.push(newTeam);
        break;
      
      case 'updateTeam':
        const updatedTeam: Team = data;
        const teamIndex = serverData.teams.findIndex(t => t.id === updatedTeam.id);
        if (teamIndex >= 0) {
          serverData.teams[teamIndex] = updatedTeam;
        }
        break;
      
      case 'deleteTeam':
        const teamId = data;
        serverData.teams = serverData.teams.filter(t => t.id !== teamId);
        serverData.teamScores = serverData.teamScores.filter(s => s.teamId !== teamId);
        updateAggregatedScores();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: serverData });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    switch (type) {
      case 'teamScores':
        // Удаляем все оценки (для сброса данных)
        serverData.teamScores = [];
        updateAggregatedScores();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: serverData });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}