/**
 * Health Check Endpoint
 * 
 * Проверяет состояние критических компонентов системы.
 * Используется для мониторинга и Vercel health checks.
 */

import { NextResponse } from 'next/server';
import { isRedisAvailable } from '@/lib/redis-wrapper';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    redis: {
      status: 'ok' | 'error';
      latencyMs?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'warning';
      missing?: string[];
    };
  };
  version: string;
}

export async function GET() {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      redis: { status: 'ok' },
      environment: { status: 'ok' },
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  // Проверка Redis
  try {
    const redisStart = Date.now();
    const redisOk = await isRedisAvailable();
    const redisLatency = Date.now() - redisStart;
    
    if (redisOk) {
      health.checks.redis = {
        status: 'ok',
        latencyMs: redisLatency,
      };
    } else {
      health.checks.redis = {
        status: 'error',
        error: 'Redis ping failed',
      };
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'unhealthy';
  }

  // Проверка обязательных переменных окружения
  // НЕ раскрываем имена отсутствующих переменных в ответе (Information Disclosure)
  const requiredEnvVars = [
    'REDIS_URL',
    'SESSION_SECRET',
    'CSRF_SECRET',
  ];
  
  const missingCount = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  ).length;
  
  if (missingCount > 0) {
    health.checks.environment = {
      status: 'warning',
      // Не раскрываем какие именно переменные отсутствуют
    };
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  // Определить HTTP статус
  const httpStatus = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: httpStatus });
}
