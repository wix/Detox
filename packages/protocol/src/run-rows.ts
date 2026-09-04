/**
 * The run rows (spec 013): the one on-disk contract between a jest worker
 * and the `detox test` process that spawned it. The worker's environment
 * appends one JSON row per session it opens to `runs/<worker pid>.jsonl`
 * beside the config snapshot (the one file both already agree on,
 * `DETOX_CONFIG_SNAPSHOT_PATH`); after jest exits the CLI reads every
 * row and prints `detox run <runId> → <viewerUrl>`, whatever the exit
 * code. Declared once, here, so neither side can drift alone.
 */
import path from 'node:path';

export const RUN_ROWS_DIR = 'runs';

export interface RunRow {
  runId: string;
  /** The `ws://` (or `wss://`) address the session dialed. */
  serverUrl: string;
  /** The server's HTTP origin plus `/v1/runs/<runId>/perfetto` (spec 012a's page). */
  viewerUrl: string;
  /** Whether the server wanted a bearer: the CLI then hints at `#token=` once. */
  gated: boolean;
}

/** The directory the rows of one `detox test` run live in: `runs/` beside the snapshot. */
export function runRowsDir(snapshotPath: string): string {
  return path.join(path.dirname(snapshotPath), RUN_ROWS_DIR);
}

/** One worker's file inside {@link runRowsDir}. */
export function runRowsFile(snapshotPath: string, pid: number): string {
  return path.join(runRowsDir(snapshotPath), `${String(pid)}.jsonl`);
}

/** A parsed row is one only when it carries the three strings the CLI prints from. */
export function isRunRow(value: unknown): value is RunRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Partial<RunRow>;
  return typeof row.runId === 'string' && typeof row.viewerUrl === 'string' && typeof row.serverUrl === 'string';
}
