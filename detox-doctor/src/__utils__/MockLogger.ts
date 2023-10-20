import type { Logger } from '../types';

export class MockLogger implements Logger {
  public debug = jest.fn();
  public log = jest.fn();

  clear(level: 'debug' | 'log' = 'log'): void {
    this[level].mockClear();
  }

  dump(level: 'debug' | 'log' = 'log'): string {
    return this[level].mock.calls.map((c) => c.join(' ')).join('\n');
  }

  dumpJSON(level: 'debug' | 'log' = 'log'): object[] {
    return this[level].mock.calls.map((c) => {
      return JSON.parse(c[0]);
    });
  }
}
