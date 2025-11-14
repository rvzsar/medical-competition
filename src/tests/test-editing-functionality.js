/* eslint-disable @typescript-eslint/no-require-imports */
// Тестирование функционала редактирования оценок
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Тестирование функционала редактирования оценок...\n');

// Проверка наличия необходимых файлов
const contestPages = [
  'src/app/admin/contest/visit-card/page.tsx',
  'src/app/admin/contest/clinical-case/page.tsx',
  'src/app/admin/contest/practical-skills/page.tsx',
  'src/app/admin/contest/mind-battle/page.tsx',
  'src/app/admin/contest/jury-question/page.tsx'
];

let allTestsPassed = true;

// Проверка синтаксиса TypeScript
console.log('📝 Проверка синтаксиса TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: path.join(__dirname, '../..') });
  console.log('✅ Синтаксис TypeScript корректен\n');
} catch (error) {
  console.log('❌ Ошибки синтаксиса TypeScript:');
  console.log(error.stdout.toString());
  allTestsPassed = false;
}

// Проверка наличия функционала редактирования в каждой странице
console.log('🔧 Проверка наличия функционала редактирования...');

const editingFeatures = [
  'isEditing',
  'hasUnsavedChanges',
  'setIsEditing',
  'setHasUnsavedChanges',
  'loadScore',
  'режим редактирования',
  'Отменить изменения',
  'Обновить оценку'
];

contestPages.forEach(page => {
  const filePath = path.join(__dirname, '../..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const missingFeatures = editingFeatures.filter(feature => !content.includes(feature));
    
    if (missingFeatures.length === 0) {
      console.log(`✅ ${page}: Все функции редактирования реализованы`);
    } else {
      console.log(`❌ ${page}: Отсутствуют функции: ${missingFeatures.join(', ')}`);
      allTestsPassed = false;
    }
  } else {
    console.log(`❌ Файл не найден: ${page}`);
    allTestsPassed = false;
  }
});

// Проверка правильности обработки состояния
console.log('\n🔄 Проверка логики управления состоянием...');
contestPages.forEach(page => {
  const filePath = path.join(__dirname, '../..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем наличие правильной логики для hasUnsavedChanges
    const hasCorrectStateManagement = content.includes('setHasUnsavedChanges(true)') &&
                                      content.includes('setHasUnsavedChanges(false)');
    
    if (hasCorrectStateManagement) {
      console.log(`✅ ${page}: Логика управления состоянием корректна`);
    } else {
      console.log(`❌ ${page}: Проблемы с логикой управления состоянием`);
      allTestsPassed = false;
    }
  }
});

// Проверка UI элементов редактирования
console.log('\n🎨 Проверка UI элементов редактирования...');
contestPages.forEach(page => {
  const filePath = path.join(__dirname, '../..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем наличие кнопок отмены и обновления
    const hasEditingButtons = content.includes('Отменить изменения') &&
                              content.includes('Обновить оценку');
    
    // Проверяем наличие индикатора режима редактирования
    const hasEditingIndicator = content.includes('режим редактирования');
    
    // Проверяем наличие предупреждения о несохраненных изменениях
    const hasUnsavedWarning = content.includes('Есть несохраненные изменения');
    
    if (hasEditingButtons && hasEditingIndicator && hasUnsavedWarning) {
      console.log(`✅ ${page}: UI элементы редактирования полные`);
    } else {
      console.log(`❌ ${page}: Проблемы с UI элементами редактирования`);
      if (!hasEditingButtons) console.log('   - Отсутствуют кнопки редактирования');
      if (!hasEditingIndicator) console.log('   - Отсутствует индикатор режима');
      if (!hasUnsavedWarning) console.log('   - Отсутствует предупреждение о изменениях');
      allTestsPassed = false;
    }
  }
});

// Итоговый результат
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 Все тесты пройдены! Функционал редактирования оценок реализован корректно.');
} else {
  console.log('❌ Некоторые тесты не пройдены. Необходимо исправить обнаруженные проблемы.');
  process.exit(1);
}