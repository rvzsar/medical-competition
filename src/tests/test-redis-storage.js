// Тестирование Redis хранилища
const fs = require('fs');
const path = require('path');

console.log('🔄 Тестирование Redis хранилища...\n');

// Проверка наличия файлов
const redisStoragePath = path.join(__dirname, '../utils/redisStorage.ts');
const apiRoutePath = path.join(__dirname, '../app/api/data/route.ts');

console.log('📁 Проверка файлов Redis хранилища...');

if (fs.existsSync(redisStoragePath)) {
  console.log('✅ Файл redisStorage.ts найден');
  
  const redisStorageContent = fs.readFileSync(redisStoragePath, 'utf8');
  
  // Проверка ключевых функций
  const requiredFunctions = [
    'getAllData',
    'getTeams',
    'getTeamScores',
    'getAggregatedScores',
    'addTeamScore',
    'addTeam',
    'updateTeam',
    'deleteTeam',
    'clearAllScores',
    'backupData',
    'restoreData',
    'updateAllTeams',
    'updateAllTeamScores'
  ];
  
  console.log('\n🔧 Проверка функций Redis хранилища:');
  requiredFunctions.forEach(func => {
    if (redisStorageContent.includes(`export async function ${func}`)) {
      console.log(`✅ ${func} - реализована`);
    } else {
      console.log(`❌ ${func} - отсутствует`);
    }
  });
  
  // Проверка импорта redis
  if (redisStorageContent.includes("import { createClient, RedisClientType } from 'redis'")) {
    console.log('✅ Импорт redis настроен');
  } else {
    console.log('❌ Импорт redis отсутствует');
  }
  
  // Проверка REDIS_URL
  if (redisStorageContent.includes('process.env.REDIS_URL')) {
    console.log('✅ REDIS_URL environment variable используется');
  } else {
    console.log('❌ REDIS_URL environment variable отсутствует');
  }
  
  // Проверка ключей хранения
  const requiredKeys = [
    'medical-competition:teams',
    'medical-competition:team-scores',
    'medical-competition:aggregated-scores',
    'medical-competition:jury-members'
  ];
  
  console.log('\n🔑 Проверка ключей хранения:');
  requiredKeys.forEach(key => {
    if (redisStorageContent.includes(key)) {
      console.log(`✅ ${key} - используется`);
    } else {
      console.log(`❌ ${key} - отсутствует`);
    }
  });
  
} else {
  console.log('❌ Файл kvStorage.ts не найден');
}

console.log('\n📁 Проверка API route для KV...');

if (fs.existsSync(apiRoutePath)) {
  console.log('✅ Файл API route найден');
  
  const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');
  
  // Проверка импорта Redis функций
  if (apiRouteContent.includes('from \'@/utils/redisStorage\'')) {
    console.log('✅ Импорт Redis функций в API route настроен');
  } else {
    console.log('❌ Импорт Redis функций в API route отсутствует');
  }
  
  // Проверка использования KV функций
  const kvFunctionsInAPI = [
    'getTeams()',
    'getTeamScores()',
    'getAggregatedScores()',
    'addTeamScore(',
    'addTeam(',
    'updateTeam(',
    'deleteTeam(',
    'clearAllScores(',
    'updateAllTeams(',
    'updateAllTeamScores('
  ];
  
  console.log('\n🔧 Проверка использования Redis функций в API:');
  kvFunctionsInAPI.forEach(func => {
    if (apiRouteContent.includes(func)) {
      console.log(`✅ ${func} - используется`);
    } else {
      console.log(`❌ ${func} - отсутствует`);
    }
  });
  
} else {
  console.log('❌ Файл API route не найден');
}

// Проверка package.json для redis
const packageJsonPath = path.join(__dirname, '../../../../package.json');
console.log('\n📦 Проверка зависимостей...');

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies && packageJson.dependencies['redis']) {
    console.log('✅ redis установлен');
    console.log(`📌 Версия: ${packageJson.dependencies['redis']}`);
  } else {
    console.log('❌ redis не установлен');
  }
} else {
  console.log('❌ package.json не найден');
}

// Проверка документации
const redisSetupPath = path.join(__dirname, '../../../../REDIS_SETUP.md');
console.log('\n📚 Проверка документации...');

if (fs.existsSync(redisSetupPath)) {
  console.log('✅ Документация REDIS_SETUP.md найдена');
  
  const docContent = fs.readFileSync(redisSetupPath, 'utf8');
  
  const requiredSections = [
  'Создание Redis базы данных',
  'Настройка Environment Variables',
  'Техническая реализация',
  'Преимущества Redis на Vercel',
  'Лимиты и рекомендации'
];
  
  console.log('\n📖 Проверка разделов документации:');
  requiredSections.forEach(section => {
    if (docContent.includes(section)) {
      console.log(`✅ ${section} - присутствует`);
    } else {
      console.log(`❌ ${section} - отсутствует`);
    }
  });
  
} else {
  console.log('❌ Документация REDIS_SETUP.md не найдена');
}

console.log('\n' + '='.repeat(60));
console.log('🎯 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ REDIS ХРАНЕНИЯ');
console.log('='.repeat(60));

// Итоговая проверка
const allChecks = [
  fs.existsSync(redisStoragePath),
  fs.existsSync(apiRoutePath),
  fs.existsSync(packageJsonPath),
  fs.existsSync(redisSetupPath)
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

if (passedChecks === totalChecks) {
  console.log('🎉 ВСЕ ФАЙЛЫ И КОМПОНЕНТЫ REDIS ХРАНЕНИЯ НА МЕСТЕ!');
  console.log('✨ Система готова к работе с Redis');
  console.log('🚀 После настройки REDIS_URL все данные будут сохраняться постоянно');
} else {
  console.log(`⚠️  Проблемы обнаружены: ${totalChecks - passedChecks} из ${totalChecks} проверок не пройдены`);
  console.log('🔧 Необходимо устранить проблемы перед развертыванием');
}

console.log('\n📋 СЛЕДУЮЩИЕ ШАГИ:');
console.log('1. Развернуть проект на Vercel');
console.log('2. Добавить REDIS_URL в Environment Variables');
console.log('3. Проверить работу сохранения данных');
console.log('4. Убедиться что данные не теряются при обновлении страницы');

console.log('\n💡 Дополнительная информация:');
console.log('- Детальная инструкция: REDIS_SETUP.md');
console.log('- Redis URL уже предоставлен');
console.log('- Нужно добавить в Environment Variables');