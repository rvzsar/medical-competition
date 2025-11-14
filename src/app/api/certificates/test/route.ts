import { NextResponse } from 'next/server';
import { getAggregatedScores, getTeams } from '@/utils/redisStorage';

export async function GET() {
  try {
    const teams = await getTeams();
    const scores = await getAggregatedScores();

    const envCheck = {
      redis: !!process.env.REDIS_URL,
      emailHost: !!process.env.EMAIL_HOST,
      emailUser: !!process.env.EMAIL_USER,
      emailFrom: !!process.env.EMAIL_FROM,
    };

    return NextResponse.json({
      success: true,
      message: 'API работает корректно',
      data: {
        teamsCount: teams.length,
        scoresCount: scores.length,
        environmentVariables: envCheck,
      },
      teams,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка при проверке системы',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}