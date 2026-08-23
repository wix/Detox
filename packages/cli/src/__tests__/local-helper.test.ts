import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ensureLocalHelper, restartLocalHelper } from '../local-helper';

interface EnvSnapshot {
  DETOX_LOCAL_HELPER_ROOT?: string;
}

interface CookieFixture {
  kind: 'detox-local-helper';
  pid: number;
  url: string;
  protocol: number;
  token: string;
  startedAt: string;
}

const savedEnv: EnvSnapshot = {
  DETOX_LOCAL_HELPER_ROOT: process.env.DETOX_LOCAL_HELPER_ROOT,
};

afterEach(() => {
  restoreEnvKey('DETOX_LOCAL_HELPER_ROOT', savedEnv.DETOX_LOCAL_HELPER_ROOT);
});

describe('local helper attach-or-spawn', () => {
  it('refuses instead of spawning a second helper when a live cookie pid is unreachable', async () => {
    const root = useHelperRoot();
    writeCookie(root, {
      kind: 'detox-local-helper',
      pid: process.pid,
      url: 'ws://127.0.0.1:9',
      protocol: 1,
      token: '0123456789abcdef',
      startedAt: new Date().toISOString(),
    });

    await expect(ensureLocalHelper()).rejects.toThrow(/pid .*alive.*does not answer/s);
  });

  it('restart refuses when the cookie pid is live but helper admin ownership cannot be verified', async () => {
    const root = useHelperRoot();
    writeCookie(root, {
      kind: 'detox-local-helper',
      pid: process.pid,
      url: 'ws://127.0.0.1:9',
      protocol: 1,
      token: '0123456789abcdef',
      startedAt: new Date().toISOString(),
    });

    await expect(restartLocalHelper()).rejects.toThrow(/admin status could not be verified/);
  });
});

function useHelperRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'detox-local-helper-unit-'));
  process.env.DETOX_LOCAL_HELPER_ROOT = root;
  return root;
}

function writeCookie(root: string, cookie: CookieFixture): void {
  writeFileSync(path.join(root, 'server.json'), JSON.stringify(cookie, null, 2), { mode: 0o600 });
}

function restoreEnvKey(key: keyof EnvSnapshot, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
