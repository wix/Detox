/**
 * Snapshot mapping, field by field (spec 010's integration-gated contract):
 * server/token → url/bearer (NO header when no token), apps verbatim,
 * `device.query` → `device`; a malformed/absent snapshot path is the typed
 * instructive refusal naming `detox test`.
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { DetoxErrorCode } from 'detox/client';
import type { ConfigSnapshot } from '@detox-remote/protocol';

import { loadSnapshot, mapSnapshot } from '../snapshot';

interface WithCode {
  code?: number;
}

const SNAPSHOT: ConfigSnapshot = {
  configurationName: 'ios.sim.release',
  client: { server: 'ws://127.0.0.1:8099', token: 'secret-token' },
  apps: [
    { name: 'example', bundleId: 'com.wix.detox-example', binaryPath: '/tmp/example.app' },
    { name: 'other', bundleId: 'com.wix.other' },
  ],
  device: { type: 'ios.simulator', query: { model: 'iPhone 17 Pro', os: '26.0' } },
};

function writeSnapshotFixture(value: unknown): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'detox-jest-snapshot-'));
  const file = path.join(dir, 'config-snapshot.json');
  writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
  return file;
}

describe('mapSnapshot — the recorded 009 seam', () => {
  it('maps client.server + client.token to url + bearer header', () => {
    const config = mapSnapshot(SNAPSHOT);
    expect(config.server).toEqual({
      url: 'ws://127.0.0.1:8099',
      headers: { Authorization: 'Bearer secret-token' },
    });
  });

  it('sends NO Authorization header when no token is configured', () => {
    const config = mapSnapshot({ ...SNAPSHOT, client: { server: 'ws://127.0.0.1:1' } });
    expect(config.server).toEqual({ url: 'ws://127.0.0.1:1' });
    expect('headers' in config.server).toBe(false);
  });

  it('carries apps VERBATIM — name, bundleId, binaryPath, extras all ride', () => {
    const withExtras = {
      ...SNAPSHOT,
      apps: [{ name: 'x', bundleId: 'com.x', launchArgs: { hello: 'world' } }],
    };
    expect(mapSnapshot(withExtras).apps).toEqual(withExtras.apps);
  });

  it('maps device.query to the compat device query', () => {
    expect(mapSnapshot(SNAPSHOT).device).toEqual({ model: 'iPhone 17 Pro', os: '26.0' });
  });

  it('omits device when the snapshot has no query', () => {
    const config = mapSnapshot({ ...SNAPSHOT, device: undefined } as unknown as ConfigSnapshot);
    expect('device' in config).toBe(false);
  });

  it('refuses a snapshot with no client.server — it did not come from detox test', () => {
    expect(() =>
      mapSnapshot({ ...SNAPSHOT, client: {} } as unknown as ConfigSnapshot),
    ).toThrowError(/client\.server/);
  });
});

describe('loadSnapshot — the environment door', () => {
  it('reads the file named by DETOX_CONFIG_SNAPSHOT_PATH and defaults exposeGlobals true', () => {
    const file = writeSnapshotFixture(SNAPSHOT);
    const loaded = loadSnapshot({ DETOX_CONFIG_SNAPSHOT_PATH: file });
    expect(loaded.snapshot.configurationName).toBe('ios.sim.release');
    expect(loaded.behavior.exposeGlobals).toBe(true);
  });

  it('consumes behavior.init.exposeGlobals: false', () => {
    const file = writeSnapshotFixture({
      ...SNAPSHOT,
      behavior: { init: { exposeGlobals: false } },
    });
    expect(loadSnapshot({ DETOX_CONFIG_SNAPSHOT_PATH: file }).behavior.exposeGlobals).toBe(false);
  });

  it('refuses an ABSENT variable with a typed, instructive message naming `detox test`', () => {
    for (const env of [{}, { DETOX_CONFIG_SNAPSHOT_PATH: '' }]) {
      try {
        loadSnapshot(env);
        expect.unreachable('loadSnapshot must refuse');
      } catch (err) {
        expect((err as WithCode).code).toBe(DetoxErrorCode.DETOX_NOT_INITIALIZED);
        expect((err as Error).message).toContain('detox test');
      }
    }
  });

  it('refuses an unreadable path, naming the path and detox test', () => {
    try {
      loadSnapshot({ DETOX_CONFIG_SNAPSHOT_PATH: '/nonexistent/snapshot.json' });
      expect.unreachable('loadSnapshot must refuse');
    } catch (err) {
      expect((err as WithCode).code).toBe(DetoxErrorCode.DETOX_NOT_INITIALIZED);
      expect((err as Error).message).toContain('/nonexistent/snapshot.json');
      expect((err as Error).message).toContain('detox test');
    }
  });

  it('refuses malformed JSON typed, naming the path', () => {
    const file = writeSnapshotFixture('{ not json');
    try {
      loadSnapshot({ DETOX_CONFIG_SNAPSHOT_PATH: file });
      expect.unreachable('loadSnapshot must refuse');
    } catch (err) {
      expect((err as WithCode).code).toBe(DetoxErrorCode.DETOX_NOT_INITIALIZED);
      expect((err as Error).message).toContain(file);
    }
  });
});
