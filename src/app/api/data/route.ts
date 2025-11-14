import { NextRequest, NextResponse } from 'next/server';
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
  clearJuryScores,
  backupData,
  restoreData,
  updateAllTeams,
  updateAllTeamScores,
  getScoresLockStatus,
  setScoresLocked,
} from '@/utils/redisStorage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'teams':
        return NextResponse.json(await getTeams());
      
      case 'teamScores':
        return NextResponse.json(await getTeamScores());
      
      case 'aggregatedScores':
        return NextResponse.json(await getAggregatedScores());
      
      case 'juryMembers':
        return NextResponse.json(await getJuryMembers());
      
      case 'all':
        return NextResponse.json(await getAllData());
      
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
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        {
          const lockStateForAdd = await getScoresLockStatus();
          if (lockStateForAdd.locked) {
            return NextResponse.json(
              { error: 'Изменение оценок заблокировано организатором' },
              { status: 423 },
            );
          }
          const addScoreResult = await addTeamScore(data);
          return NextResponse.json({ success: true, data: addScoreResult });
        }
      
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

      case 'setScoresLock':
        if (typeof data?.locked !== 'boolean') {
          return NextResponse.json({ error: 'locked flag is required' }, { status: 400 });
        }
        // jury_id из cookie в authCookie уже проверен выше
        const lockState = await setScoresLocked(data.locked, authCookie.value);
        return NextResponse.json({ success: true, data: lockState });

      case 'clearJuryScores':
        if (!data?.juryId) {
          return NextResponse.json({ error: 'juryId is required' }, { status: 400 });
        }
        const clearedJuryScores = await clearJuryScores(data.juryId, data.contestId);
        return NextResponse.json({ success: true, data: clearedJuryScores });
      
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
    const authCookie = request.cookies.get('jury_id');
    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'scoresLock') {
      const state = await getScoresLockStatus();
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('x-scores-locked', state.locked ? '1' : '0');
      return response;
    }

    return new NextResponse(null, { status: 400 });
  } catch (error) {
    console.error('API HEAD Error:', error);
    return new NextResponse(null, { status: 500 });
  }
}