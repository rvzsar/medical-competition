import { NextRequest, NextResponse } from 'next/server';
import { Team, TeamScore, AggregatedScore, JuryMember } from '@/types';
import {
  getAllData,
  getTeams,
  getTeamScores,
  getAggregatedScores,
  getJuryMembers,
  addTeamScore,
  addTeam,
  updateTeam,
  deleteTeam,
  clearAllScores,
  backupData,
  restoreData,
  updateAllTeams,
  updateAllTeamScores
} from '@/utils/redisStorage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'teams':
        const teams = await getTeams();
        return NextResponse.json(teams);
      
      case 'teamScores':
        const teamScores = await getTeamScores();
        return NextResponse.json(teamScores);
      
      case 'aggregatedScores':
        const aggregatedScores = await getAggregatedScores();
        return NextResponse.json(aggregatedScores);
      
      case 'juryMembers':
        const juryMembers = await getJuryMembers();
        return NextResponse.json(juryMembers);
      
      case 'all':
        const allData = await getAllData();
        return NextResponse.json(allData);
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'teams':
        // Прямое обновление всех команд
        const teamsResult = await updateAllTeams(data);
        return NextResponse.json({ success: true, data: teamsResult });
      
      case 'teamScores':
        // Прямое обновление всех оценок
        const scoresResult = await updateAllTeamScores(data);
        return NextResponse.json({ success: true, data: scoresResult });
      
      case 'addTeamScore':
        const addScoreResult = await addTeamScore(data);
        return NextResponse.json({ success: true, data: addScoreResult });
      
      case 'addTeam':
        const addTeamResult = await addTeam(data);
        return NextResponse.json({ success: true, data: addTeamResult });
      
      case 'updateTeam':
        const updateTeamResult = await updateTeam(data);
        return NextResponse.json({ success: true, data: updateTeamResult });
      
      case 'deleteTeam':
        const deleteTeamResult = await deleteTeam(data);
        return NextResponse.json({ success: true, data: deleteTeamResult });
      
      case 'backup':
        const backupResult = await backupData();
        return NextResponse.json({ success: true, data: backupResult });
      
      case 'restore':
        const restoreResult = await restoreData(data.backupKey);
        return NextResponse.json({ success: true, data: restoreResult });
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'teamScores':
        // Удаляем все оценки (для сброса данных)
        const result = await clearAllScores();
        return NextResponse.json({ success: true, data: result });
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}