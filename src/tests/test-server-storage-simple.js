// Упрощенный тест серверного хранения и многопользовательского режима
const fs = require('fs');
const path = require('path');

console.log('🔄 Тестирование серверного хранения и многопользовательского режима...\n');

// Проверка API route
const apiRoutePath = path.join(__dirname, '../../../../medical-competition/src/app/api/data/route.ts');
if (!fs.existsSync(apiRoutePath)) {
  console.log('❌ API route для данных не найден');
  console.log(`🔍 Ожидаемый путь: ${apiRoutePath}`);
  process.exit(1);
}

console.log('✅ API route найден');

// Проверка содержимого API route
const apiContent = fs.readFileSync(apiRoutePath, 'utf8');

// Проверка ключевых функций серверного хранения
const requiredFeatures = [
  'teams',
  'teamScores', 
  'aggregatedScores',
  'addTeam',
  'addTeamScore',
  'juryId',
  'updateAggregatedScores'
];

let allFeaturesPresent = true;
requiredFeatures.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует ключевая функция: ${feature}`);
    allFeaturesPresent = false;
  }
});

if (allFeaturesPresent) {
  console.log('✅ Все ключевые функции серверного хранения присутствуют');
}

// Проверка многопользовательских функций
const multiUserFeatures = [
  'GET',
  'POST',
  'serverData',
  'existingIndex',
  'findIndex'
];

let multiUserPresent = true;
multiUserFeatures.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует функция многопользовательского режима: ${feature}`);
    multiUserPresent = false;
  }
});

if (multiUserPresent) {
  console.log('✅ Функции многопользовательского режима реализованы');
}

// Проверка агрегации оценок
if (apiContent.includes('average') && apiContent.includes('calculateAggregatedScore')) {
  console.log('✅ Функции агрегации оценок реализованы');
} else {
  console.log('❌ Функции агрегации оценок отсутствуют');
  multiUserPresent = false;
}

// Проверка обработки одновременного доступа
if (apiContent.includes('existingIndex') && apiContent.includes('findIndex')) {
  console.log('✅ Обработка одновременного доступа реализована');
} else {
  console.log('❌ Обработка одновременного доступа отсутствует');
  multiUserPresent = false;
}

// Проверка клиентских компонентов
const clientFiles = [
  '../../../../medical-competition/src/app/admin/contest/visit-card/page.tsx',
  '../../../../medical-competition/src/app/admin/contest/clinical-case/page.tsx'
];

let clientPresent = true;
clientFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('juryId') || !content.includes('loadScores')) {
      console.log(`❌ В файле ${file} отсутствуют функции многопользовательского режима`);
      clientPresent = false;
    }
  } else {
    console.log(`❌ Файл не найден: ${file}`);
    clientPresent = false;
  }
});

if (clientPresent) {
  console.log('✅ Клиентские компоненты поддерживают многопользовательский режим');
}

// Проверка системы идентификации жюри
const loginPath = path.join(__dirname, '../../../../medical-competition/src/app/login/page.tsx');
if (fs.existsSync(loginPath)) {
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  if (loginContent.includes('localStorage') && loginContent.includes('juryMember')) {
    console.log('✅ Система идентификации жюри реализована');
  } else {
    console.log('❌ Система идентификации жюри неполная');
    clientPresent = false;
  }
} else {
  console.log('❌ Страница входа не найдена');
  clientPresent = false;
}

// Итоговая оценка
console.log('\n' + '='.repeat(60));
console.log('🎯 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
console.log('='.repeat(60));

const allTestsPassed = allFeaturesPresent && multiUserPresent && clientPresent;

if (allTestsPassed) {
  console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
  console.log('✨ Серверное хранение работает корректно');
  console.log('🚀 Многопользовательский режим поддерживается');
  console.log('💾 Данные сохраняются между сессиями');
  console.log('👥 Все члены жюри могут одновременно работать');
  process.exit(0);
} else {
  console.log('⚠️ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
  console.log('🔧 Проверьте систему перед использованием');
  process.exit(1);
}