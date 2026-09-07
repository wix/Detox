/**
 * The run rows (spec 013): how a jest worker tells `detox test` which run
 * its session opened. One JSON row per line in `runs/<worker pid>.jsonl`
 * beside the config snapshot (the one file both processes already agree
 * on), appended when a session opens — one per worker in practice, a
 * second if the helper restarted mid-run — and read by the CLI after jest
 * exits, whatever the exit code, so a run is named even when its worker
 * died. No worker-to-parent transport, no reporter, no timer.
 */
import { appendFileSync, mkdirSync } from 'node:fs';

import { runRowsDir, runRowsFile, type RunRow } from '@detox-remote/protocol';

export { runRowsDir, type RunRow } from '@detox-remote/protocol';

/** `ws://host:port` → `http://host:port/v1/runs/<runId>/perfetto` (`wss` → `https`). */
export function viewerUrlFor(serverUrl: string, runId: string): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  url.pathname = `/v1/runs/${encodeURIComponent(runId)}/perfetto`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

/** Appends one row for this worker; a failure to write never fails a test file (the run still happened). */
export function appendRunRow(snapshotPath: string, row: RunRow, pid: number = process.pid): void {
  try {
    mkdirSync(runRowsDir(snapshotPath), { recursive: true, mode: 0o700 });
    appendFileSync(runRowsFile(snapshotPath, pid), `${JSON.stringify(row)}\n`, { mode: 0o600 });
  } catch {
    // Naming the run is a courtesy to the CLI; the log itself lives on the server.
  }
}
