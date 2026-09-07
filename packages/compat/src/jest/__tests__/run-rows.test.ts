import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { appendRunRow, runRowsDir, viewerUrlFor } from '../run-rows';

describe('the run rows (spec 013)', () => {
  it('derives the viewer URL from the ws address: http origin + the perfetto page', () => {
    expect(viewerUrlFor('ws://127.0.0.1:8080', 'abc')).toBe('http://127.0.0.1:8080/v1/runs/abc/perfetto');
    expect(viewerUrlFor('wss://farm.example:443/?x=1#y', 'a b')).toBe('https://farm.example/v1/runs/a%20b/perfetto');
  });

  it('appends one JSON row per session to runs/<pid>.jsonl beside the snapshot', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'detox-run-rows-'));
    const snapshotPath = path.join(dir, 'config-snapshot.json');
    writeFileSync(snapshotPath, '{}');
    expect(runRowsDir(snapshotPath)).toBe(path.join(dir, 'runs'));
    appendRunRow(snapshotPath, { runId: 'r1', serverUrl: 'ws://h:1', viewerUrl: 'http://h:1/v1/runs/r1/perfetto', gated: true }, 42);
    appendRunRow(snapshotPath, { runId: 'r2', serverUrl: 'ws://h:1', viewerUrl: 'http://h:1/v1/runs/r2/perfetto', gated: false }, 42);
    const rows = readFileSync(path.join(dir, 'runs', '42.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as unknown);
    expect(rows).toEqual([
      { runId: 'r1', serverUrl: 'ws://h:1', viewerUrl: 'http://h:1/v1/runs/r1/perfetto', gated: true },
      { runId: 'r2', serverUrl: 'ws://h:1', viewerUrl: 'http://h:1/v1/runs/r2/perfetto', gated: false },
    ]);
  });

  it('a row that cannot be written never throws — naming the run is a courtesy', () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'detox-run-rows-')), 'not-a-dir');
    writeFileSync(file, 'x');
    // `runs/` would have to be created under a regular file.
    expect(() => appendRunRow(path.join(file, 'config-snapshot.json'), { runId: 'r', serverUrl: 'ws://h:1', viewerUrl: 'u', gated: false })).not.toThrow();
  });
});
