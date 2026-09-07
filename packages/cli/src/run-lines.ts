/**
 * The last thing `detox test` prints (spec 013): `detox run <runId> →
 * <viewerUrl>`, one line per session a worker opened, read from the rows
 * the jest environment appended beside the config snapshot
 * (`runs/<worker pid>.jsonl`, see compat's `run-rows.ts`). Printed
 * whatever jest's exit code, and even when a worker died — whatever rows
 * exist are named. A gated server gets the `#token=` hint once.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { isRunRow, runRowsDir, type RunRow } from '@detox-remote/protocol';

export type { RunRow } from '@detox-remote/protocol';

/** The token hint's exact wording — the accept file pins it. */
export const GATED_HINT = '(add #token=… for a gated server)';

/** Every row under `runs/` beside the snapshot, workers in pid order, rows in append order; nothing there → none. */
export function readRunRows(snapshotPath: string): RunRow[] {
  const dir = runRowsDir(snapshotPath);
  let names: string[];
  try {
    names = readdirSync(dir).filter((name) => name.endsWith('.jsonl')).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
  } catch {
    return [];
  }
  const rows: RunRow[] = [];
  for (const name of names) {
    let text: string;
    try {
      text = readFileSync(path.join(dir, name), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      if (line.trim().length === 0) continue;
      try {
        const parsed: unknown = JSON.parse(line);
        if (isRunRow(parsed)) rows.push({ runId: parsed.runId, serverUrl: parsed.serverUrl, viewerUrl: parsed.viewerUrl, gated: parsed.gated === true });
      } catch {
        // A half-written row (a worker killed mid-append) names nothing.
      }
    }
  }
  return rows;
}

export function formatRunLines(rows: readonly RunRow[]): string[] {
  let hinted = false;
  return rows.map((row) => {
    const hint = row.gated && !hinted ? ` ${GATED_HINT}` : '';
    if (row.gated) hinted = true;
    return `detox run ${row.runId} → ${row.viewerUrl}${hint}`;
  });
}
