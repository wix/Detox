/**
 * The reporter shim: the project's own jest default reporting, undecorated —
 * per-file reporter (verbose when the run is) + summary, every hook forwarded
 * to both in order, `getLastError` first-answer-wins.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakes = vi.hoisted(() => {
  const calls: string[] = [];

  class FakeDelegate {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    onRunStart(...args: unknown[]): void {
      calls.push(`${this.name}.onRunStart(${args.length})`);
    }
    onTestStart(): void {
      calls.push(`${this.name}.onTestStart`);
    }
    onTestCaseStart(): void {
      calls.push(`${this.name}.onTestCaseStart`);
    }
    onTestCaseResult(): void {
      calls.push(`${this.name}.onTestCaseResult`);
    }
    onTestResult(): void {
      calls.push(`${this.name}.onTestResult`);
    }
    onRunComplete(): void {
      calls.push(`${this.name}.onRunComplete`);
    }
    getLastError(): Error | undefined {
      return this.name === 'summary' ? new Error(`${this.name} failed`) : undefined;
    }
  }

  class FakeDefaultReporter extends FakeDelegate {
    constructor(_globalConfig: unknown) {
      super('default');
    }
  }
  class FakeVerboseReporter extends FakeDelegate {
    constructor(_globalConfig: unknown) {
      super('verbose');
    }
  }
  class FakeSummaryReporter extends FakeDelegate {
    static lastOptions: unknown;
    constructor(_globalConfig: unknown, options?: unknown) {
      super('summary');
      FakeSummaryReporter.lastOptions = options;
    }
  }

  return { calls, FakeDefaultReporter, FakeVerboseReporter, FakeSummaryReporter };
});

vi.mock('../project-modules', () => ({
  requireFromProject: () => ({
    DefaultReporter: fakes.FakeDefaultReporter,
    VerboseReporter: fakes.FakeVerboseReporter,
    SummaryReporter: fakes.FakeSummaryReporter,
  }),
}));

import DetoxJestReporter from '../reporter';

const { calls, FakeSummaryReporter } = fakes;

beforeEach(() => {
  calls.length = 0;
});

describe('DetoxJestReporter', () => {
  it('composes DefaultReporter + SummaryReporter for a non-verbose run', async () => {
    const reporter = new DetoxJestReporter({ verbose: false }, { summaryThreshold: 5 });
    await reporter.onRunStart({}, {});
    expect(calls).toEqual(['default.onRunStart(2)', 'summary.onRunStart(2)']);
    expect(FakeSummaryReporter.lastOptions).toEqual({ summaryThreshold: 5 });
  });

  it('composes VerboseReporter when the run is verbose', async () => {
    const reporter = new DetoxJestReporter({ verbose: true });
    await reporter.onRunStart({}, {});
    expect(calls[0]).toBe('verbose.onRunStart(2)');
  });

  it('forwards every reporter hook to both delegates, in order', async () => {
    const reporter = new DetoxJestReporter({});
    await reporter.onTestStart({});
    await reporter.onTestCaseStart({}, {});
    await reporter.onTestCaseResult({}, {});
    await reporter.onTestResult({}, {}, {});
    await reporter.onRunComplete(new Set(), {});
    expect(calls).toEqual([
      'default.onTestStart',
      'summary.onTestStart',
      'default.onTestCaseStart',
      'summary.onTestCaseStart',
      'default.onTestCaseResult',
      'summary.onTestCaseResult',
      'default.onTestResult',
      'summary.onTestResult',
      'default.onRunComplete',
      'summary.onRunComplete',
    ]);
  });

  it('getLastError surfaces the first delegate error', () => {
    const reporter = new DetoxJestReporter({});
    expect(reporter.getLastError()?.message).toBe('summary failed');
  });
});
