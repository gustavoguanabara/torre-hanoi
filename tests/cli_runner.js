/**
 * CLI Test Runner para execução de 'npm test' via terminal
 */

import { runner } from './runner.js';
import './core.test.js';

async function execute() {
  console.log('\n=============================================================');
  console.log('  🧪 TORRE DE HANÓI - EXECUTOR DE TESTES UNITÁRIOS (CLI)');
  console.log('=============================================================\n');

  const results = await runner.run();

  for (const suite of results.suites) {
    console.log(`\n📦 Suíte: ${suite.name} (${suite.duration}ms)`);
    for (const test of suite.tests) {
      if (test.status === 'passed') {
        console.log(`   ✅ PASS: ${test.name} (${test.duration}ms)`);
      } else {
        console.log(`   ❌ FAIL: ${test.name} (${test.duration}ms)`);
        console.error(`      Erro: ${test.error?.message || test.error}`);
        if (test.error?.stack) {
          console.error(`      Stack: ${test.error.stack.split('\n').slice(1, 3).join('\n')}`);
        }
      }
    }
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`  Resumo: ${results.totalPassed} passaram | ${results.totalFailed} falharam | Total: ${results.totalTests}`);
  console.log(`  Tempo Total: ${results.duration}ms`);
  console.log('=============================================================\n');

  if (results.totalFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 Todos os testes passaram com 100% de sucesso!\n');
    process.exit(0);
  }
}

execute().catch(err => {
  console.error('Erro fatal ao rodar testes:', err);
  process.exit(1);
});
