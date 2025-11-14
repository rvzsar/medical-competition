/* eslint-disable @typescript-eslint/no-require-imports */
// Запуск всех тестов системы
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Запуск всех тестов системы медицинской олимпиады\n');
console.log('=' .repeat(60));

let totalPassed = 0;
let totalTests = 0;

// Тест 1: Система подсчета баллов
console.log('\n📊 Тест 1: Система подсчета баллов');
try {
  const output = execSync('node -r ts-node/register src/tests/test-scoring-system.ts', {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8'
  });
  console.log(output);
  
  // Извлекаем результаты из вывода
  const match = output.match(/✅ Пройдено тестов: (\d+)\/(\d+)/);
  if (match) {
    const passed = parseInt(match[1]);
    const tests = parseInt(match[2]);
    totalPassed += passed;
    totalTests += tests;
    console.log(`✅ Тест подсчета баллов: ${passed}/${tests} пройдено`);
  }
} catch (error) {
  console.log('❌ Ошибка при запуске тестов подсчета баллов:', error.message);
}

// Тест 2: Управление командами
console.log('\n👥 Тест 2: Управление командами');
try {
  const output = execSync('node -r ts-node/register src/tests/test-team-management.ts', {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8'
  });
  console.log(output);
  
  // Извлекаем результаты из вывода
  const match = output.match(/✅ Пройдено тестов: (\d+)\/(\d+)/);
  if (match) {
    const passed = parseInt(match[1]);
    const tests = parseInt(match[2]);
    totalPassed += passed;
    totalTests += tests;
    console.log(`✅ Тест управления командами: ${passed}/${tests} пройдено`);
  }
} catch (error) {
  console.log('❌ Ошибка при запуске тестов управления командами:', error.message);
}

// Тест 3: Функционал редактирования оценок
console.log('\n✏️ Тест 3: Функционал редактирования оценок');
try {
  const output = execSync('node src/tests/test-editing-functionality.js', {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8'
  });
  console.log(output);
  
  // Проверяем успешность теста редактирования
  if (output.includes('🎉 Все тесты пройдены!')) {
    totalPassed += 1;
    totalTests += 1;
    console.log('✅ Тест функционала редактирования: 1/1 пройдено');
  } else {
    totalTests += 1;
    console.log('❌ Тест функционала редактирования: 0/1 пройдено');
  }
} catch (error) {
  console.log('❌ Ошибка при запуске тестов редактирования:', error.message);
  totalTests += 1;
}

// Итоговые результаты
console.log('\n' + '=' .repeat(60));
console.log('🎯 ОБЩИЕ РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
console.log('=' .repeat(60));
console.log(`✅ Всего пройдено тестов: ${totalPassed}/${totalTests}`);
console.log(`📈 Общая успешность: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`);

if (totalPassed === totalTests && totalTests > 0) {
  console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
  console.log('✨ Система готова к использованию на медицинской олимпиаде.');
  process.exit(0);
} else {
  console.log('\n⚠️ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
  console.log('🔧 Проверьте систему перед использованием.');
  process.exit(1);
}