/**
 * Mini Test Runner Isomórfico (Zero-Dependency)
 * Executável nativamente tanto no Navegador (test.html) quanto no Node.js (cli_runner.js).
 */

class Assertion {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (Object.is(this.actual, expected)) return;
    throw new Error(`Esperado ${JSON.stringify(expected)}, mas obteve ${JSON.stringify(this.actual)}`);
  }

  toEqual(expected) {
    const act = JSON.stringify(this.actual);
    const exp = JSON.stringify(expected);
    if (act === exp) return;
    throw new Error(`Esperado equivalência estrutural com ${exp}, mas obteve ${act}`);
  }

  toBeGreaterThan(expected) {
    if (this.actual > expected) return;
    throw new Error(`Esperado que ${this.actual} fosse maior que ${expected}`);
  }

  toBeLessThan(expected) {
    if (this.actual < expected) return;
    throw new Error(`Esperado que ${this.actual} fosse menor que ${expected}`);
  }

  toBeTruthy() {
    if (Boolean(this.actual)) return;
    throw new Error(`Esperado valor truthy, mas obteve ${JSON.stringify(this.actual)}`);
  }

  toBeFalsy() {
    if (!Boolean(this.actual)) return;
    throw new Error(`Esperado valor falsy, mas obteve ${JSON.stringify(this.actual)}`);
  }

  toContain(item) {
    if (Array.isArray(this.actual) && this.actual.includes(item)) return;
    if (typeof this.actual === 'string' && this.actual.includes(item)) return;
    throw new Error(`Esperado que contivesse ${JSON.stringify(item)}, mas obteve ${JSON.stringify(this.actual)}`);
  }

  toThrow(expectedError) {
    if (typeof this.actual !== 'function') {
      throw new Error(`Esperado que o alvo fosse uma função para avaliar lançamento de exceção.`);
    }
    let threw = false;
    let thrownError = null;
    try {
      this.actual();
    } catch (e) {
      threw = true;
      thrownError = e;
    }

    if (!threw) {
      throw new Error(`Esperado que a função lançasse uma exceção, mas executou normalmente.`);
    }

    if (expectedError) {
      const msg = thrownError?.message || String(thrownError);
      if (typeof expectedError === 'string' && !msg.includes(expectedError)) {
        throw new Error(`Esperado que a mensagem contivesse "${expectedError}", mas obteve "${msg}"`);
      }
      if (expectedError instanceof RegExp && !expectedError.test(msg)) {
        throw new Error(`Esperado que a mensagem casasse com ${expectedError}, mas obteve "${msg}"`);
      }
    }
  }
}

class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0
    };
    this.suites.push(suite);
    const prev = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prev;
    }
  }

  it(name, fn) {
    if (!this.currentSuite) {
      throw new Error(`O teste "${name}" deve estar dentro de um bloco describe().`);
    }
    this.currentSuite.tests.push({ name, fn, status: 'pending', error: null, duration: 0 });
  }

  expect(actual) {
    return new Assertion(actual);
  }

  async run() {
    let totalPassed = 0;
    let totalFailed = 0;
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    for (const suite of this.suites) {
      const suiteStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      for (const test of suite.tests) {
        const testStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        try {
          await test.fn();
          test.status = 'passed';
          suite.passed++;
          totalPassed++;
        } catch (err) {
          test.status = 'failed';
          test.error = err;
          suite.failed++;
          totalFailed++;
        }
        const testEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        test.duration = Math.round((testEnd - testStart) * 100) / 100;
      }
      const suiteEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      suite.duration = Math.round((suiteEnd - suiteStart) * 100) / 100;
    }

    const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const totalDuration = Math.round((endTime - startTime) * 100) / 100;

    return {
      suites: this.suites,
      totalPassed,
      totalFailed,
      totalTests: totalPassed + totalFailed,
      duration: totalDuration
    };
  }

  reset() {
    this.suites = [];
    this.currentSuite = null;
  }
}

export const runner = new TestRunner();
export const describe = runner.describe.bind(runner);
export const it = runner.it.bind(runner);
export const expect = runner.expect.bind(runner);
