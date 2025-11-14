/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Интеграционный тест системы сертификатов
 * Проверяет работу всех компонентов: API endpoints, генерацию PDF, Redis
 */

const https = require('https');
const http = require('http');

// Конфигурация
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const isHttps = BASE_URL.startsWith('https');

console.log('🧪 Тест интеграции системы сертификатов');
console.log('📍 URL:', BASE_URL);
console.log('');

// Функция для HTTP запросов
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(data) 
              : data
          };
          resolve(response);
        } catch {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Тесты
async function runTests() {
  let passed = 0;
  let failed = 0;

  // Тест 1: Проверка /api/data?type=teams
  console.log('1️⃣ Тест: GET /api/data?type=teams');
  try {
    const response = await makeRequest('/api/data?type=teams');
    if (response.statusCode === 200 && Array.isArray(response.body)) {
      console.log('   ✅ API endpoint работает');
      console.log('   📊 Команд найдено:', response.body.length);
      
      if (response.body.length > 0) {
        console.log('   👥 Первая команда:', response.body[0].name);
        passed++;
      } else {
        console.log('   ⚠️  Команды не найдены (база пустая)');
        failed++;
      }
    } else {
      console.log('   ❌ Ошибка:', response.statusCode, response.body);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Ошибка запроса:', error instanceof Error ? error.message : String(error));
    failed++;
  }
  console.log('');

  // Тест 2: Проверка генерации PDF (командный сертификат)
  console.log('2️⃣ Тест: POST /api/certificates/generate (командный)');
  try {
    const teamsResponse = await makeRequest('/api/data?type=teams');
    if (teamsResponse.body && teamsResponse.body.length > 0) {
      const firstTeam = teamsResponse.body[0];
      
      const response = await makeRequest('/api/certificates/generate', {
        method: 'POST',
        body: {
          type: 'team',
          teamId: firstTeam.id
        }
      });

      if (response.statusCode === 200 && response.headers['content-type']?.includes('pdf')) {
        console.log('   ✅ PDF генерируется успешно');
        console.log('   📄 Content-Type:', response.headers['content-type']);
        console.log('   📦 Размер:', response.body.length, 'байт');
        passed++;
      } else {
        console.log('   ❌ Ошибка генерации:', response.statusCode);
        if (typeof response.body === 'object') {
          console.log('   📝 Детали:', response.body);
        }
        failed++;
      }
    } else {
      console.log('   ⚠️  Пропущен (нет команд для теста)');
    }
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    failed++;
  }
  console.log('');

  // Тест 3: Проверка генерации именного сертификата
  console.log('3️⃣ Тест: POST /api/certificates/generate (именной)');
  try {
    const teamsResponse = await makeRequest('/api/data?type=teams');
    if (teamsResponse.body && teamsResponse.body.length > 0) {
      const firstTeam = teamsResponse.body[0];
      
      const response = await makeRequest('/api/certificates/generate', {
        method: 'POST',
        body: {
          type: 'individual',
          teamId: firstTeam.id,
          participantName: 'Иванов Иван Иванович',
          specialAward: 'Лучшие практические навыки'
        }
      });

      if (response.statusCode === 200 && response.headers['content-type']?.includes('pdf')) {
        console.log('   ✅ Именной PDF генерируется успешно');
        console.log('   📄 Content-Type:', response.headers['content-type']);
        console.log('   📦 Размер:', response.body.length, 'байт');
        passed++;
      } else {
        console.log('   ❌ Ошибка генерации:', response.statusCode);
        if (typeof response.body === 'object') {
          console.log('   📝 Детали:', response.body);
        }
        failed++;
      }
    } else {
      console.log('   ⚠️  Пропущен (нет команд для теста)');
    }
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    failed++;
  }
  console.log('');

  // Тест 4: Проверка endpoint отправки (без реальной отправки)
  console.log('4️⃣ Тест: POST /api/certificates/send (проверка валидации)');
  try {
    const response = await makeRequest('/api/certificates/send', {
      method: 'POST',
      body: {
        type: 'team',
        participantEmail: '' // Пустой email для теста валидации
      }
    });

    if (response.statusCode === 400) {
      console.log('   ✅ Валидация работает корректно');
      console.log('   📝 Сообщение:', response.body.error);
      passed++;
    } else {
      console.log('   ❌ Неожиданный ответ:', response.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    failed++;
  }
  console.log('');

  // Тест 5: Проверка Redis подключения через /api/data
  console.log('5️⃣ Тест: Подключение к Redis (через /api/data)');
  try {
    const response = await makeRequest('/api/data');
    if (response.statusCode === 200) {
      console.log('   ✅ Redis подключен и работает');
      console.log('   📊 Команд:', response.body.teams?.length || 0);
      console.log('   📈 Оценок:', response.body.teamScores?.length || 0);
      passed++;
    } else {
      console.log('   ❌ Ошибка подключения к Redis:', response.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    failed++;
  }
  console.log('');

  // Результаты
  console.log('═══════════════════════════════════════');
  console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
  console.log('═══════════════════════════════════════');
  console.log('✅ Успешно:', passed);
  console.log('❌ Провалено:', failed);
  console.log('📈 Всего тестов:', passed + failed);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('');
    console.log('✨ Система сертификатов полностью функциональна:');
    console.log('   • API endpoints работают');
    console.log('   • Генерация PDF работает');
    console.log('   • Redis подключен');
    console.log('   • Команды загружаются');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОШЛИ');
    console.log('');
    console.log('🔍 Проверьте:');
    console.log('   • Запущен ли сервер на', BASE_URL);
    console.log('   • Настроен ли REDIS_URL в переменных окружения');
    console.log('   • Настроен ли RESEND_API_KEY (для отправки email)');
    console.log('   • Есть ли команды в базе данных');
    console.log('');
    process.exit(1);
  }
}

// Запуск тестов
runTests().catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});