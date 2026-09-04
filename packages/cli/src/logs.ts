/**
 * `detox logs` (spec 013): the fifth verb. Argv in, exit code out; every
 * side effect through an injected io, every byte through an injected
 * http — the process shell in `main.ts` binds the real ones.
 *
 *   detox logs                      the index, one line per run
 *   detox logs <id>                 the outline (`--all` with ticks)
 *   detox logs <id> --failures      the diagnosis
 *   detox logs <id> --json          the raw JSONL (`--out`, `--follow`)
 *   … --under <name>                one subtree, composed with any view
 */
import { parseTraceLines, selectUnder, toFailures, toOutline, type TraceLogLine } from '@detox-remote/perfetto';

import { ConfigError, UsageError } from './errors';
import { LOGS_HELP, parseLogsArgv, type LogsArgv } from './logs-argv';
import { createLogsHttp, type LogsHttp, type RunIndexRow } from './logs-http';
import { resolveLogsServer, type LogsServer } from './logs-server';

export interface LogsIo {
  stdout(text: string): void;
  stderr(text: string): void;
  writeFile(file: string, text: string): void;
}

export interface LogsDeps {
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  io: LogsIo;
  helperAddress: () => Promise<{ url: string } | undefined>;
  /** The http client for a resolved server; the default is the real one. */
  http?: (server: LogsServer) => LogsHttp;
}

/** Exit 2: a usage or config refusal, one line, never a stack. */
export const LOGS_REFUSAL_EXIT = 2;

/** `<runId>  <startedAt>  <ended|live>  <lines>` */
export function formatIndexRow(row: RunIndexRow): string {
  return `${row.runId}  ${row.startedAt}  ${row.endedAt !== undefined ? 'ended' : 'live'}  ${String(row.lastSeq)}`;
}

function renderView(lines: TraceLogLine[], argv: LogsArgv, runId: string, headings: boolean): string {
  if (argv.failures) return toFailures(lines, { runId });
  return toOutline(lines, { runId, all: argv.all, headings });
}

function rawOf(lines: readonly TraceLogLine[]): string {
  return lines.map((line) => `${JSON.stringify(line)}\n`).join('');
}

export async function runLogs(tokens: readonly string[], deps: LogsDeps): Promise<number> {
  const { io } = deps;
  try {
    const argv = parseLogsArgv(tokens);
    if (argv.help) {
      io.stdout(`${LOGS_HELP}\n`);
      return 0;
    }
    const server = await resolveLogsServer({
      cwd: deps.cwd,
      env: deps.env,
      flags: { configuration: argv.configuration, configPath: argv.configPath },
      helperAddress: deps.helperAddress,
    });
    const http = (deps.http ?? createLogsHttp)(server);

    if (argv.runId === undefined) {
      const rows = await http.index();
      io.stdout(rows.map((row) => `${formatIndexRow(row)}\n`).join(''));
      return 0;
    }
    const runId = argv.runId;

    // The raw file: streamed as it arrives under --follow, saved under --out.
    if (argv.json && argv.under === undefined) {
      if (argv.out !== undefined) {
        const text = await http.log(runId);
        io.writeFile(argv.out, text);
        io.stdout(`wrote ${String(text.split('\n').filter((l) => l.length > 0).length)} lines of run ${runId} to ${argv.out}\n`);
        return 0;
      }
      await http.log(runId, { follow: argv.follow, onChunk: (chunk) => io.stdout(chunk) });
      return 0;
    }

    const text = await http.log(runId);
    const lines = parseTraceLines(text);
    if (argv.under === undefined) {
      io.stdout(renderView(lines, argv, runId, true));
      return 0;
    }

    const selections = selectUnder(lines, argv.under);
    if (selections.length === 0) {
      throw new UsageError(`detox logs: nothing named "${argv.under}" in run ${runId} (searched step names and fullNames, rpc names and methods, and node ids)`);
    }
    if (argv.json) {
      const raw = selections.map((selection) => rawOf(selection.lines)).join('');
      if (argv.out !== undefined) {
        io.writeFile(argv.out, raw);
        io.stdout(`wrote ${String(selections.reduce((n, s) => n + s.lines.length, 0))} lines under "${argv.under}" of run ${runId} to ${argv.out}\n`);
      } else {
        io.stdout(raw);
      }
      return 0;
    }
    const views = selections.map((selection) => renderView(selection.lines, argv, runId, false));
    if (views.length === 1) {
      io.stdout(views[0]);
    } else {
      // Several matches: each subtree under a heading naming which one.
      io.stdout(views.map((view, i) => `── ${argv.under ?? ''} · match ${String(i + 1)} of ${String(views.length)} · ${selections[i].node.id} ──\n${view}`).join('\n'));
    }
    return 0;
  } catch (err) {
    if (err instanceof UsageError || err instanceof ConfigError) {
      io.stderr(`${err.message}\n`);
      return LOGS_REFUSAL_EXIT;
    }
    throw err;
  }
}
