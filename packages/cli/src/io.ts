/**
 * The snapshot as an object on disk (spec 009): created mode 0600 (it may
 * carry a token), named to the runner by DETOX_CONFIG_SNAPSHOT_PATH, and
 * deleted on every exit path — a snapshot that outlives its run is a
 * credential lying on disk.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { ConfigSnapshot } from '@detox-remote/protocol';

export function writeSnapshotFile(snapshot: ConfigSnapshot): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'detox-snapshot-'));
  const file = path.join(dir, 'config-snapshot.json');
  writeFileSync(file, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
  return file;
}

/** @issue DTX-5001: idempotent and tolerates a missing file — every exit path calls it, some twice. */
export function deleteSnapshotFile(file: string): void {
  try {
    rmSync(path.dirname(file), { recursive: true, force: true });
  } catch {
    // A snapshot we cannot delete must not turn a finished run red.
  }
}

