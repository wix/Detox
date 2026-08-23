/**
 * The 010 fate table (spec 010's integration-gated "Fates enforced"): each
 * warned key warns once naming itself and its heir; `exposeGlobals` is
 * consumed silently; unknown `testRunner.jest` keys warn as unknown.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ConfigSnapshot } from '@detox-remote/protocol';

import { collectFateWarnings, emitFateWarnings, resetFateWarningsForTest } from '../fates';

const base: ConfigSnapshot = {
  configurationName: 'ios.sim',
  client: { server: 'ws://127.0.0.1:1' },
  apps: [],
  device: { type: 'ios.simulator', query: {} },
};

const keysOf = (snapshot: ConfigSnapshot): string[] =>
  collectFateWarnings(snapshot).map((warning) => warning.key);

describe('collectFateWarnings', () => {
  it('warns each recorded behavior key by name', () => {
    const keys = keysOf({
      ...base,
      behavior: {
        init: { reinstallApp: true, launchApp: 'auto', exposeGlobals: false },
        launchApp: 'manual',
        cleanup: { shutdownDevice: true },
      },
    });
    expect(keys).toEqual([
      'behavior.init.reinstallApp',
      'behavior.init.launchApp',
      'behavior.launchApp',
      'behavior.cleanup.shutdownDevice',
    ]);
  });

  it('never warns the consumed key (behavior.init.exposeGlobals)', () => {
    expect(keysOf({ ...base, behavior: { init: { exposeGlobals: false } } })).toEqual([]);
  });

  it('warns the five recorded testRunner.jest keys, each naming itself', () => {
    const warnings = collectFateWarnings({
      ...base,
      testRunner: {
        args: { $0: 'jest' },
        jest: {
          setupTimeout: 120_000,
          teardownTimeout: 30_000,
          reportSpecs: true,
          reportWorkerAssign: true,
          retries: 2,
        },
      },
    });
    expect(warnings.map((warning) => warning.key)).toEqual([
      'testRunner.jest.setupTimeout',
      'testRunner.jest.teardownTimeout',
      'testRunner.jest.reportSpecs',
      'testRunner.jest.reportWorkerAssign',
      'testRunner.jest.retries',
    ]);
    for (const warning of warnings) {
      expect(warning.message).toContain(warning.key);
    }
    // The two dead clocks name their replacement (jest's own testTimeout);
    // the other three name their HEIR — the fate table's whole promise.
    expect(warnings[0].message).toContain('testTimeout');
    expect(warnings[1].message).toContain('testTimeout');
    expect(warnings[2].message).toContain('heir');
    expect(warnings[3].message).toContain('heir');
    expect(warnings[4].message).toContain('heir');
  });

  it('every warned behavior key names its heir too', () => {
    const warnings = collectFateWarnings({
      ...base,
      behavior: {
        init: { reinstallApp: true, launchApp: 'auto' },
        launchApp: 'manual',
        cleanup: { shutdownDevice: true },
      },
    });
    for (const warning of warnings) {
      expect(warning.message).toContain('heir');
    }
  });

  it('warns UNKNOWN testRunner.jest keys — the forwarded silence is over', () => {
    const warnings = collectFateWarnings({
      ...base,
      testRunner: { args: { $0: 'jest' }, jest: { somethingNew: 1 } },
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].key).toBe('testRunner.jest.somethingNew');
    expect(warnings[0].message).toContain('not a key this Detox version knows');
  });

  it('warns nothing for a snapshot with neither behavior nor testRunner.jest', () => {
    expect(keysOf(base)).toEqual([]);
    expect(keysOf({ ...base, testRunner: { args: { $0: 'jest' } } })).toEqual([]);
  });
});

describe('emitFateWarnings — once per key per process', () => {
  beforeEach(() => {
    resetFateWarningsForTest();
  });

  it('emits each key once across repeated calls (one setup per test file)', () => {
    const snapshot = { ...base, behavior: { cleanup: { shutdownDevice: true } } };
    const seen: string[] = [];
    emitFateWarnings(snapshot, (message) => seen.push(message));
    emitFateWarnings(snapshot, (message) => seen.push(message));
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('behavior.cleanup.shutdownDevice');
  });

  it('speaks through console.warn by default', async () => {
    const { vi } = await import('vitest');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      emitFateWarnings({ ...base, behavior: { launchApp: 'auto' } });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain('behavior.launchApp');
    } finally {
      warn.mockRestore();
    }
  });
});
