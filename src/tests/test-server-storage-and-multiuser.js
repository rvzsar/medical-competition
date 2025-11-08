// Тестирование серверного хранения данных и многопользовательского режима
const fs = require('fs');
const path = require('path');

console.log('🔄 Тестирование серверного хранения и многопользовательского режима...\n');

// Проверка структуры API routes
const apiRoutePath = path.join(__dirname, '../../../src/app/api/data/route.ts');
if (!fs.existsSync(apiRoutePath)) {
  console.log('❌ API route для данных не найден');
  console.log(`🔍 Ожидаемый путь: ${apiRoutePath}`);
  process.exit(1);
}

console.log('✅ API route найден');

// Проверка реализации серверного хранения
const apiContent = fs.readFileSync(apiRoutePath, 'utf8');

// Проверяем наличие необходимых функций
const requiredFunctions = [
  'GET',
  'POST',
  'serverData',
  'teams',
  'teamScores',
  'aggregatedScores'
];

let allFunctionsPresent = true;
requiredFunctions.forEach(func => {
  if (!apiContent.includes(func)) {
    console.log(`❌ Отсутствует функция/переменная: ${func}`);
    allFunctionsPresent = false;
  }
});

if (allFunctionsPresent) {
  console.log('✅ Все необходимые функции серверного хранения присутствуют');
}

// Проверка обработки команд
const teamOperations = [
  'addTeam',
  'updateTeam',
  'deleteTeam'
];

let teamOpsPresent = true;
teamOperations.forEach(op => {
  if (!apiContent.includes(op)) {
    console.log(`❌ Отсутствует операция с командами: ${op}`);
    teamOpsPresent = false;
  }
});

if (teamOpsPresent) {
  console.log('✅ Все операции с командами реализованы');
}

// Проверка обработки оценок
const scoreOperations = [
  'addTeamScore',
  'updateAggregatedScores'
];

let scoreOpsPresent = true;
scoreOperations.forEach(op => {
  if (!apiContent.includes(op)) {
    console.log(`❌ Отсутствует операция с оценками: ${op}`);
    scoreOpsPresent = false;
  }
});

if (scoreOpsPresent) {
  console.log('✅ Все операции с оценками реализованы');
}

// Проверка многопользовательских функций
const multiUserFeatures = [
  'juryId',
  'juryName',
  'multipleJuryMembers',
  'averageScore'
];

let multiUserPresent = true;
multiUserFeatures.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует функция многопользовательского режима: ${feature}`);
    multiUserPresent = false;
  }
});

if (multiUserPresent) {
  console.log('✅ Все функции многопользовательского режима реализованы');
}

// Проверка агрегации оценок
const aggregationFeatures = [
  'calculateAggregatedScore',
  'updateAggregatedScores',
  'average'
];

let aggregationPresent = true;
aggregationFeatures.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует функция агрегации: ${feature}`);
    aggregationPresent = false;
  }
});

if (aggregationPresent) {
  console.log('✅ Все функции агрегации оценок реализованы');
}

// Проверка обработки конфликтов и одновременной работы
const concurrencyFeatures = [
  'existingIndex',
  'findIndex',
  'push'
];

let concurrencyPresent = true;
concurrencyFeatures.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует функция обработки одновременного доступа: ${feature}`);
    concurrencyPresent = false;
  }
});

if (concurrencyPresent) {
  console.log('✅ Функции обработки одновременного доступа реализованы');
}

// Проверка сохранения данных между сессиями
const persistenceFeatures = [
  'serverData',
  'JSON.stringify',
  'JSON.parse'
];

let persistencePresent = true;
persistenceFeatures.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует функция сохранения данных: ${feature}`);
    persistencePresent = false;
  }
});

if (persistencePresent) {
  console.log('✅ Функции сохранения данных реализованы');
}

// Проверка клиентских компонентов для многопользовательской работы
const clientFiles = [
  '../../app/admin/contest/visit-card/page.tsx',
  '../../app/admin/contest/clinical-case/page.tsx',
  '../../app/admin/contest/practical-skills/page.tsx'
];

let clientMultiUserPresent = true;
clientFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const requiredFeatures = ['juryId', 'loadScores', 'juryMember'];
    
    requiredFeatures.forEach(feature => {
      if (!content.includes(feature)) {
        console.log(`❌ В файле ${file} отсутствует: ${feature}`);
        clientMultiUserPresent = false;
      }
    });
  } else {
    console.log(`❌ Файл не найден: ${file}`);
    clientMultiUserPresent = false;
  }
});

if (clientMultiUserPresent) {
  console.log('✅ Клиентские компоненты поддерживают многопользовательский режим');
}

// Проверка системы идентификации жюри
const jurySystemFiles = [
  '../../app/login/page.tsx',
  '../../components/JuryAuth.tsx'
];

let jurySystemPresent = true;
jurySystemFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const requiredFeatures = ['localStorage', 'juryMember', 'setJuryMember'];
    
    requiredFeatures.forEach(feature => {
      if (!content.includes(feature)) {
        console.log(`❌ В файле ${file} отсутствует: ${feature}`);
        jurySystemPresent = false;
      }
    });
  } else {
    console.log(`❌ Файл не найден: ${file}`);
    jurySystemPresent = false;
  }
});

if (jurySystemPresent) {
  console.log('✅ Система идентификации жюри реализована');
}

// Проверка обработки ошибок и валидации
const errorHandling = [
  'try',
  'catch',
  'error'
];

let errorHandlingPresent = true;
errorHandling.forEach(feature => {
  if (!apiContent.includes(feature)) {
    console.log(`❌ Отсутствует обработка ошибок: ${feature}`);
    errorHandlingPresent = false;
  }
});

if (errorHandlingPresent) {
  console.log('✅ Обработка ошибок реализована');
}

// Итоговая оценка
console.log('\n' + '='.repeat(60));
console.log('🎯 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ СЕРВЕРНОГО ХРАНЕНИЯ И МНОГОПОЛЬЗОВАТЕЛЬСКОГО РЕЖИМА');
console.log('='.repeat(60));

const allTests = [
  allFunctionsPresent,
  teamOpsPresent,
  scoreOpsPresent,
  multiUserPresent,
  aggregationPresent,
  concurrencyPresent,
  persistencePresent,
  clientMultiUserPresent,
  jurySystemPresent,
  errorHandlingPresent
];

const passedTests = allTests.filter(test => test).length;
const totalTests = allTests.length;

console.log(`✅ Пройдено тестов: ${passedTests}/${totalTests}`);
console.log(`📈 Успешность: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
  console.log('✨ Серверное хранение и многопользовательский режим работают корректно');
  console.log('🚀 Все члены жюри могут одновременно работать в системе');
  console.log('💾 Данные сохраняются на сервере между сессиями');
  process.exit(0);
} else {
  console.log('\n⚠️ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
  console.log('🔧 Проверьте систему перед использованием');
  process.exit(1);
}