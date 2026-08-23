/**
 * Snapshot and nodes files on disk (spec 009): both are written mode 0600 —
 * they may carry tokens — into their own temp dirs; deletion removes the
 * file AND its dir, is idempotent, and tolerates a path that never existed
 * (every exit path calls it, some twice).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';
import type { ConfigSnapshot } from '@detox-remote/protocol';

import { deleteSnapshotFile, writeSnapshotFile } from '../io';

const SNAPSHOT: ConfigSnapshot = {
  configurationName: 'ios.sim',
  client: { server: 'ws://127.0.0.1:8099', token: 'secret-token' },
  apps: [{ name: 'default', binaryPath: '/abs/bin/Example.app' }],
  device: { type: 'ios.simulator', query: { model: 'iPhone 14' } },
};

describe('writeSnapshotFile', () => {
  it('writes parseable JSON, mode 0600, into its own temp dir', () => {
    const file = writeSnapshotFile(SNAPSHOT);
    try {
      expect(statSync(file).mode & 0o777).toBe(0o600);
      expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(SNAPSHOT);
      expect(path.basename(file)).toBe('config-snapshot.json');
    } finally {
      deleteSnapshotFile(file);
    }
  });

  it('two snapshots never collide — each gets a fresh dir', () => {
    const a = writeSnapshotFile(SNAPSHOT);
    const b = writeSnapshotFile(SNAPSHOT);
    try {
      expect(a).not.toBe(b);
      expect(path.dirname(a)).not.toBe(path.dirname(b));
    } finally {
      deleteSnapshotFile(a);
      deleteSnapshotFile(b);
    }
  });
});

/**
 * @issue DTX-5001
 * `deleteSnapshotFile` is idempotent and tolerates a path that never
 * existed — every exit path calls it, some of them twice.
 */
describe('deleteSnapshotFile', () => {
  it('removes the file and its temp dir', () => {
    const file = writeSnapshotFile(SNAPSHOT);
    deleteSnapshotFile(file);
    expect(existsSync(file)).toBe(false);
    expect(existsSync(path.dirname(file))).toBe(false);
  });

  it('is idempotent and tolerates a path that never existed', () => {
    const file = writeSnapshotFile(SNAPSHOT);
    deleteSnapshotFile(file);
    expect(() => deleteSnapshotFile(file)).not.toThrow();
    expect(() =>
      deleteSnapshotFile('/no/such/dir/ever/config-snapshot.json'),
    ).not.toThrow();
  });
});

// There is no `writeNodesFile`: a config-sourced roster travels to the relay
// main in process, so node tokens never touch a file.
