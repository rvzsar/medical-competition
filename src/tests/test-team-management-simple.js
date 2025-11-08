// Упрощенное тестирование системы управления командами через API
const http = require('http');

// Базовый URL для API (запущенный локально)
const API_BASE = 'http://localhost:3000/api/data';

// Функция для выполнения HTTP запросов
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          reject(new Error(`Ошибка парсинга JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Моковые данные для тестирования
const mockTeam = {
  id: 'test-team-' + Date.now(),
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
  console.log('🧪 Тестирование системы управления командами через API...\n');
  
  let passedTests = 0;
  let totalTests = 5;

  try {
    // Проверяем, запущен ли сервер
    console.log('0️⃣ Проверка доступности API...');
    try {
      const response = await makeRequest('?type=teams');
      if (response.status === 200) {
        console.log('   ✅ API доступен');
        console.log(`   ✓ Получено команд: ${response.data.length}`);
      } else {
        throw new Error(`API недоступен, статус: ${response.status}`);
      }
    } catch (error) {
      console.log('   ❌ Ошибка:', error.message);
      console.log('   ⚠️ Убедитесь, что сервер разработки запущен (npm run dev)');
      return false;
    }

    // Тест 1: Получение списка команд
    console.log('\n1️⃣ Тест: Получение списка команд');
    try {
      const response = await makeRequest('?type=teams');
      const teams = response.data;
      const initialCount = teams.length;
      console.log(`   ✓ Получено команд: ${teams.length}`);
      console.log(`   ✓ Первая команда: ${teams[0]?.name || 'Нет команд'}`);
      passedTests++;
    } catch (error) {
      console.log('   ✗ Ошибка при получении списка команд:', error.message);
    }

    // Тест 2: Добавление новой команды
    console.log('\n2️⃣ Тест: Добавление новой команды');
    try {
      const response = await makeRequest('', 'POST', { type: 'addTeam', data: mockTeam });
      if (response.status === 200) {
        console.log(`   ✓ Команда "${mockTeam.name}" успешно добавлена`);
        console.log(`   ✓ ID команды: ${mockTeam.id}`);
        passedTests++;
      } else {
        console.log('   ✗ Ошибка при добавлении команды:', response.data?.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.log('   ✗ Ошибка при добавлении команды:', error.message);
    }

    // Тест 3: Обновление команды
    console.log('\n3️⃣ Тест: Обновление команды');
    try {
      const response = await makeRequest('', 'POST', { type: 'updateTeam', data: updatedMockTeam });
      if (response.status === 200) {
        console.log(`   ✓ Команда успешно обновлена`);
        console.log(`   ✓ Новое название: "${updatedMockTeam.name}"`);
        console.log(`   ✓ Новое количество участников: ${updatedMockTeam.members.length}`);
        passedTests++;
      } else {
        console.log('   ✗ Ошибка при обновлении команды:', response.data?.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.log('   ✗ Ошибка при обновлении команды:', error.message);
    }

    // Тест 4: Проверка сохранения команды
    console.log('\n4️⃣ Тест: Проверка сохранения команды');
    try {
      const response = await makeRequest('?type=teams');
      const teams = response.data;
      const savedTeam = teams.find(t => t.id === mockTeam.id);
      
      if (savedTeam && savedTeam.name === updatedMockTeam.name) {
        console.log(`   ✓ Команда сохранена корректно`);
        console.log(`   ✓ Название: "${savedTeam.name}"`);
        console.log(`   ✓ Участники: ${savedTeam.members.join(', ')}`);
        passedTests++;
      } else {
        console.log('   ✗ Команда не найдена или данные не сохранены');
      }
    } catch (error) {
      console.log('   ✗ Ошибка при проверке сохранения:', error.message);
    }

    // Тест 5: Удаление команды
    console.log('\n5️⃣ Тест: Удаление команды');
    try {
      const response = await makeRequest('', 'POST', { type: 'deleteTeam', data: mockTeam.id });
      if (response.status === 200) {
        // Проверяем, что команда удалена
        const checkResponse = await makeRequest('?type=teams');
        const teams = checkResponse.data;
        const deletedTeam = teams.find(t => t.id === mockTeam.id);
        
        if (!deletedTeam) {
          console.log(`   ✓ Команда "${mockTeam.name}" успешно удалена`);
          passedTests++;
        } else {
          console.log('   ✗ Команда все еще присутствует в списке после удаления');
        }
      } else {
        console.log('   ✗ Ошибка при удалении команды:', response.data?.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.log('   ✗ Ошибка при удалении команды:', error.message);
    }

  } catch (error) {
    console.log('❌ Критическая ошибка при тестировании:', error.message);
  }

  // Итоги тестирования
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Результаты тестирования управления командами:`);
  console.log(`   ✅ Пройдено тестов: ${passedTests}/${totalTests}`);
  console.log(`   📈 Успешность: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Все тесты пройдены! Система управления командами работает корректно.');
    return true;
  } else {
    console.log('\n⚠️ Некоторые тесты не пройдены. Проверьте систему управления командами.');
    return false;
  }
}

// Запуск тестов
if (require.main === module) {
  testTeamManagement().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testTeamManagement };