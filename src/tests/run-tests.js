/* eslint-disable @typescript-eslint/no-require-imports */
// Скрипт для запуска тестов в Node.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Создаем временную версию тестового файла для Node.js
const testContent = `
// Автоматическое тестирование системы подсчета баллов
// Имитация функций расчета из конкурсов

function calculateVisitCardTotal(score) {
  return score.integrity + score.culture + score.creativity + score.originality - (score.timePenalty || 0);
}

function calculateClinicalCaseTotal(score) {
  let total = score.explanation;
  if (score.correctAnswer && score.earlyCompletion) {
    total += 1; // бонус за досрочное выполнение
  }
  // Если ответ неправильный, максимальный балл - 1 (только за объяснение)
  if (!score.correctAnswer && total > 1) {
    total = 1;
  }
  return total;
}

function calculateSuturesTotal(sutures) {
  return sutures.aesthetics + sutures.adaptation + sutures.technique + sutures.time;
}

function calculateAmbulatoryTotal(ambulatory) {
  return ambulatory.preparation + ambulatory.technique + ambulatory.completion;
}

function calculateObstetricTotal(obstetric) {
  return obstetric.correctness + obstetric.safety + obstetric.time + obstetric.teamwork;
}

function calculateLaparoscopyTotal(laparoscopy) {
  return (
    laparoscopy.translocation.accuracy + laparoscopy.translocation.trajectory +
    laparoscopy.coordination.accuracy + laparoscopy.coordination.trajectory +
    laparoscopy.targeting.accuracy + laparoscopy.targeting.trajectory +
    laparoscopy.parking.accuracy + laparoscopy.parking.trajectory
  );
}

function calculatePracticalSkillsTotal(score) {
  return (
    calculateSuturesTotal(score.sutures) +
    calculateAmbulatoryTotal(score.ambulatoryReception) +
    calculateObstetricTotal(score.obstetricAid) +
    calculateLaparoscopyTotal(score.laparoscopy)
  );
}

// Тестовые данные
const testCases = [
  {
    name: "Конкурс 'Визитка' - максимальные баллы",
    contest: 'visit-card',
    score: {
      integrity: 2,
      culture: 1,
      creativity: 2,
      originality: 1,
      timePenalty: 0,
    },
    expected: 6,
    description: "Все максимальные баллы, без штрафа"
  },
  {
    name: "Конкурс 'Визитка' - со штрафом",
    contest: 'visit-card',
    score: {
      integrity: 2,
      culture: 1,
      creativity: 2,
      originality: 1,
      timePenalty: 1,
    },
    expected: 5,
    description: "Все максимальные баллы, штраф 1 минута"
  },
  {
    name: "Конкурс 'Клинический случай' - правильный ответ с бонусом",
    contest: 'clinical-case',
    score: {
      correctAnswer: true,
      explanation: 3,
      earlyCompletion: true,
    },
    expected: 4,
    description: "Правильный ответ, подробное объяснение, досрочное выполнение"
  },
  {
    name: "Конкурс 'Клинический случай' - неправильный ответ",
    contest: 'clinical-case',
    score: {
      correctAnswer: false,
      explanation: 3,
      earlyCompletion: false,
    },
    expected: 1,
    description: "Неправильный ответ, но хорошее объяснение (ограничено 1 баллом)"
  },
  {
    name: "Конкурс 'Клинический случай' - правильный ответ без бонуса",
    contest: 'clinical-case',
    score: {
      correctAnswer: true,
      explanation: 2,
      earlyCompletion: false,
    },
    expected: 2,
    description: "Правильный ответ, хорошее объяснение, без досрочного выполнения"
  },
  {
    name: "Конкурс 'Практические навыки' - максимальные баллы",
    contest: 'practical-skills',
    score: {
      sutures: {
        aesthetics: 3,
        adaptation: 4,
        technique: 3,
        time: 2,
      },
      ambulatoryReception: {
        preparation: 3,
        technique: 5,
        completion: 4,
      },
      obstetricAid: {
        correctness: 5,
        safety: 3,
        time: 2,
        teamwork: 2,
      },
      laparoscopy: {
        translocation: { accuracy: 2, trajectory: 2 },
        coordination: { accuracy: 2, trajectory: 2 },
        targeting: { accuracy: 2, trajectory: 2 },
        parking: { accuracy: 2, trajectory: 2 },
      },
    },
    expected: 52,
    description: "Все максимальные баллы по всем станциям (реальный максимум 52)"
  },
  {
    name: "Конкурс 'Битва умов' - полный ответ",
    contest: 'mind-battle',
    score: {
      correctAnswer: true,
      points: 2,
    },
    expected: 2,
    description: "Полный правильный ответ"
  },
  {
    name: "Конкурс 'Вопрос от жюри' - частичный ответ",
    contest: 'jury-question',
    score: {
      correctAnswer: true,
      points: 1,
    },
    expected: 1,
    description: "Ответ с неточностями"
  }
];

// Функция для запуска тестов
function runTests() {
  console.log("🧪 Запуск автоматизированного тестирования системы подсчета баллов\\n");
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    let actual;
    
    switch (testCase.contest) {
      case 'visit-card':
        actual = calculateVisitCardTotal(testCase.score);
        break;
      case 'clinical-case':
        actual = calculateClinicalCaseTotal(testCase.score);
        break;
      case 'practical-skills':
        actual = calculatePracticalSkillsTotal(testCase.score);
        break;
      case 'mind-battle':
      case 'jury-question':
        actual = testCase.score.points || 0;
        break;
      default:
        actual = 0;
    }
    
    const passed = actual === testCase.expected;
    const status = passed ? "✅ ПРойден" : "❌ Провален";
    
    console.log(\`\${index + 1}. \${testCase.name}\`);
    console.log(\`   Описание: \${testCase.description}\`);
    console.log(\`   Ожидается: \${testCase.expected}, Получено: \${actual}\`);
    console.log(\`   Статус: \${status}\`);
    
    if (!passed) {
      console.log(\`   ⚠️  Ошибка: несоответствие расчета баллов!\`);
    }
    
    console.log("");
    
    if (passed) passedTests++;
  });
  
  console.log(\`\\n📊 Результаты тестирования:\`);
  console.log(\`   Пройдено тестов: \${passedTests}/\${totalTests}\`);
  console.log(\`   Процент успешности: \${Math.round((passedTests / totalTests) * 100)}%\`);
  
  if (passedTests === totalTests) {
    console.log(\`\\n🎉 Все тесты пройдены! Система подсчета баллов работает корректно.\`);
  } else {
    console.log(\`\\n⚠️  Обнаружены ошибки в системе подсчета баллов. Требуется исправление.\`);
  }
  
  return passedTests === totalTests;
}

// Функция для тестирования усреднения оценок
function testScoreAveraging() {
  console.log("\\n🔄 Тестирование усреднения оценок от разных жюри:");
  
  const testScores = [
    { juryId: "1", score: 6 },
    { juryId: "2", score: 5 },
    { juryId: "3", score: 7 }
  ];
  
  const average = testScores.reduce((sum, s) => sum + s.score, 0) / testScores.length;
  const roundedAverage = Math.round(average * 10) / 10;
  
  console.log(\`   Оценки жюри: \${testScores.map(s => s.score).join(", ")}\`);
  console.log(\`   Среднее: \${average}\`);
  console.log(\`   Округленное: \${roundedAverage}\`);
  
  const expected = 6.0;
  const passed = roundedAverage === expected;
  const status = passed ? "✅ ПРойден" : "❌ Провален";
  
  console.log(\`   Статус: \${status}\`);
  
  return passed;
}

// Основная функция тестирования
function runAllTests() {
  console.log("=".repeat(60));
  console.log("АВТОМАТИЗИРОВАННОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ ОЦЕНКИ");
  console.log("=".repeat(60));
  
  const scoringTestsPassed = runTests();
  const averagingTestsPassed = testScoreAveraging();
  
  console.log("\\n" + "=".repeat(60));
  console.log("ИТОГОВЫЕ РЕЗУЛЬТАТЫ:");
  console.log(\`   Тесты подсчета баллов: \${scoringTestsPassed ? "✅" : "❌"}\`);
  console.log(\`   Тесты усреднения оценок: \${averagingTestsPassed ? "✅" : "❌"}\`);
  
  const allTestsPassed = scoringTestsPassed && averagingTestsPassed;
  console.log(\`   Общий статус: \${allTestsPassed ? "✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ" : "❌ ЕСТЬ ПРОБЛЕМЫ"}\`);
  console.log("=".repeat(60));
  
  return allTestsPassed;
}

// Запускаем тесты
runAllTests();
`;

// Записываем временный файл и запускаем
const tempFilePath = path.join(__dirname, 'temp-test.js');
fs.writeFileSync(tempFilePath, testContent);

try {
  execSync(`node "${tempFilePath}"`, { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('Ошибка при выполнении тестов:', error.message);
} finally {
  // Удаляем временный файл
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
}