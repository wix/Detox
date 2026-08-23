/**
 * The four `detox/runners/jest/*` entry modules plus the project-resolution
 * helper: globalSetup is an async no-op BY CONTRACT (resolving and doing
 * nothing is the behavior, not a stub); globalTeardown closes only a
 * session THIS process holds; the index serves v20's destructuring shape.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { compatStateBox, type CompatState } from '../../state';

const cleanup = vi.fn(async () => {});

vi.mock('../../index', () => ({
  init: vi.fn(async () => {}),
  cleanup: () => cleanup(),
  device: { getPlatform: (): 'ios' => 'ios' },
  element: () => ({}),
  by: {},
  waitFor: () => ({}),
  expect: () => ({}),
}));

import globalSetup from '../globalSetup';
import globalTeardown from '../globalTeardown';
import testEnvironmentDefault from '../testEnvironment';
import runnersIndexDefault, { DetoxCircusEnvironment, globalSetup as indexSetup, globalTeardown as indexTeardown } from '../index';
import { requireFromProject } from '../project-modules';

const box = compatStateBox();

afterEach(() => {
  box.state = undefined;
  box.pendingInit = undefined;
  vi.clearAllMocks();
});

describe('globalSetup', () => {
  it('resolves and does nothing — that IS the contract', async () => {
    await expect(globalSetup()).resolves.toBeUndefined();
  });
});

describe('globalTeardown', () => {
  it('no-ops when this process holds no session (worker mode)', async () => {
    await globalTeardown();
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('closes the session this process holds (the in-band case)', async () => {
    box.state = { session: {} } as unknown as CompatState;
    await globalTeardown();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('waits out a pending init before closing (cleanup owns that race)', async () => {
    box.pendingInit = Promise.resolve();
    await globalTeardown();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe('the module shapes', () => {
  it('testEnvironment default-exports the environment class', () => {
    expect(testEnvironmentDefault).toBe(DetoxCircusEnvironment);
  });

  it('detox/runners/jest keeps v20 destructuring AND the class as default', () => {
    expect(runnersIndexDefault).toBe(DetoxCircusEnvironment);
    expect(indexSetup).toBe(globalSetup);
    expect(indexTeardown).toBe(globalTeardown);
    expect(typeof DetoxCircusEnvironment).toBe('function');
  });
});

describe('no process.exit in the environment sources — the grep gate', () => {
  it('greps every jest-integration source for the forbidden exit', async () => {
    // The run must exit non-zero THROUGH jest, never via a bare
    // process.exit from inside the environment (spec 010's binding
    // "Environment-rank failure surfacing" — this test is the gate the
    // source comments cite).
    const { readdirSync, readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(__dirname, '..');
    const sources = readdirSync(dir).filter((name) => name.endsWith('.ts'));
    expect(sources.length).toBeGreaterThan(5);
    for (const name of sources) {
      // The CALL shape — comments legitimately name `process.exit` in prose.
      expect(readFileSync(path.join(dir, name), 'utf8')).not.toContain('process.exit(');
    }
  });
});

describe('requireFromProject', () => {
  it('resolves a real project dependency from cwd', () => {
    const mod = requireFromProject<Record<string, unknown>>('jest-environment-node', 'ships with jest');
    expect(mod).toBeTruthy();
  });

  it('refuses an unresolvable name with the hint and the cwd', () => {
    expect(() => requireFromProject('surely-not-a-package-xyz', 'install it')).toThrowError(
      /surely-not-a-package-xyz.*install it/s,
    );
  });
});
