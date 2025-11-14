import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedScores, getTeams } from '@/utils/redisStorage';

export async function GET(request: NextRequest) {
  try {
    // Проверка Redis подключения
    const teams = await getTeams();
    const scores = await getAggregatedScores();

    // Проверка переменных окружения
    const envCheck = {
      redis: !!process.env.REDIS_URL,
      resend: !!process.env.RESEND_API_KEY,
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
      teams: teams,
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