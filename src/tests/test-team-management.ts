// Тестирование системы управления командами
import { storageUtils } from '../utils/serverStorage';

// Моковые данные для тестирования
const mockTeam = {
  id: 'test-team-1',
  name: 'Тестовая команда',
  members: ['Участник 1', 'Участник 2', 'Участник 3'],
  totalScore: 0
};

const updatedMockTeam = {
  ...mockTeam,
  name: 'Обновленная команда',
  members: ['Участник 1', 'Участник 2', 'Участник 3', 'Участник 4']
};

async function testTeamManagement() {
  console.log('🧪 Тестирование системы управления командами...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  // Тест 1: Получение списка команд
  totalTests++;
  console.log('1️⃣ Тест: Получение списка команд');
  try {
    const teams = await storageUtils.getTeams();
    console.log(`   ✓ Получено команд: ${teams.length}`);
    console.log(`   ✓ Первая команда: ${teams[0]?.name || 'Нет команд'}`);
    passedTests++;
  } catch (error) {
    console.log('   ✗ Ошибка при получении списка команд:', error instanceof Error ? error.message : String(error));
  }

  // Тест 2: Добавление новой команды
  totalTests++;
  console.log('\n2️⃣ Тест: Добавление новой команды');
  try {
    await storageUtils.addTeam(mockTeam);
    const teams = await storageUtils.getTeams();
    const addedTeam = teams.find(t => t.id === mockTeam.id);
    
    if (addedTeam && addedTeam.name === mockTeam.name) {
      console.log(`   ✓ Команда "${mockTeam.name}" успешно добавлена`);
      console.log(`   ✓ ID команды: ${addedTeam.id}`);
      console.log(`   ✓ Участники: ${addedTeam.members.join(', ')}`);
      passedTests++;
    } else {
      console.log('   ✗ Команда не найдена после добавления');
    }
  } catch (error) {
    console.log('   ✗ Ошибка при добавлении команды:', error instanceof Error ? error.message : String(error));
  }

  // Тест 3: Обновление команды
  totalTests++;
  console.log('\n3️⃣ Тест: Обновление команды');
  try {
    await storageUtils.updateTeam(updatedMockTeam);
    const teams = await storageUtils.getTeams();
    const updatedTeam = teams.find(t => t.id === updatedMockTeam.id);
    
    if (updatedTeam && updatedTeam.name === updatedMockTeam.name) {
      console.log(`   ✓ Команда успешно обновлена`);
      console.log(`   ✓ Новое название: "${updatedTeam.name}"`);
      console.log(`   ✓ Новое количество участников: ${updatedTeam.members.length}`);
      passedTests++;
    } else {
      console.log('   ✗ Команда не найдена после обновления или данные не изменились');
    }
  } catch (error) {
    console.log('   ✗ Ошибка при обновлении команды:', error instanceof Error ? error.message : String(error));
  }

  // Тест 4: Удаление команды
  totalTests++;
  console.log('\n4️⃣ Тест: Удаление команды');
  try {
    await storageUtils.deleteTeam(mockTeam.id);
    const teams = await storageUtils.getTeams();
    const deletedTeam = teams.find(t => t.id === mockTeam.id);
    
    if (!deletedTeam) {
      console.log(`   ✓ Команда "${mockTeam.name}" успешно удалена`);
      console.log(`   ✓ Команда отсутствует в списке`);
      passedTests++;
    } else {
      console.log('   ✗ Команда все еще присутствует в списке после удаления');
    }
  } catch (error) {
    console.log('   ✗ Ошибка при удалении команды:', error instanceof Error ? error.message : String(error));
  }

  // Тест 5: Проверка сохранения данных между операциями
  totalTests++;
  console.log('\n5️⃣ Тест: Проверка сохранения данных');
  try {
    const teams1 = await storageUtils.getTeams();
    const count1 = teams1.length;
    
    // Добавляем тестовую команду
    await storageUtils.addTeam(mockTeam);
    
    const teams2 = await storageUtils.getTeams();
    const count2 = teams2.length;
    
    // Удаляем тестовую команду
    await storageUtils.deleteTeam(mockTeam.id);
    
    const teams3 = await storageUtils.getTeams();
    const count3 = teams3.length;
    
    if (count2 === count1 + 1 && count3 === count1) {
      console.log(`   ✓ Данные корректно сохраняются между операциями`);
      console.log(`   ✓ Исходное количество: ${count1}`);
      console.log(`   ✓ После добавления: ${count2}`);
      console.log(`   ✓ После удаления: ${count3}`);
      passedTests++;
    } else {
      console.log('   ✗ Некорректное сохранение данных между операциями');
    }
  } catch (error) {
    console.log('   ✗ Ошибка при проверке сохранения данных:', error instanceof Error ? error.message : String(error));
  }

  // Итоги тестирования
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Результаты тестирования управления командами:`);
  console.log(`   ✅ Пройдено тестов: ${passedTests}/${totalTests}`);
  console.log(`   📈 Успешность: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Все тесты пройдены! Система управления командами работает корректно.');
  } else {
    console.log('\n⚠️ Некоторые тесты не пройдены. Проверьте систему управления командами.');
  }
  
  return passedTests === totalTests;
}

// Экспорт для использования в других тестах
export { testTeamManagement };

// Запуск тестов при прямом выполнении файла
if (require.main === module) {
  testTeamManagement().then(success => {
    process.exit(success ? 0 : 1);
  });
}