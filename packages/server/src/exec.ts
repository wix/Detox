import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

import { redactArgv } from './redact';
import { spawnTrace, toolNameOf, type SpawnEnd } from './request-scope';

const execFileAsync = promisify(execFile);

/**
 * `applesimutils --list` prints the full JSON of every simulator the machine
 * knows; on a developer Mac with several runtimes that comfortably passes
 * Node's 1 MB default and would fail as ENOBUFS.
 */
const MAX_BUFFER_BYTES = 16 * 1024 * 1024;

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface ExecOpts {
  /** The executable. Never a shell string — see {@link execWithRetries}. */
  file: string;
  /** Arguments, one array element per argv slot. */
  args: readonly string[];
  signal?: AbortSignal;
  retries?: number;
  retryInterval?: number;
  timeout?: number;
  /**
   * Extra environment for the child, merged over the server's own. The launch
   * path uses it for `SIMCTL_CHILD_*` injection variables (spec 003) — simctl
   * forwards those to the app process, not to simctl itself. Never logged:
   * it carries the launch payload.
   */
  env?: Readonly<Record<string, string>>;
}

/** The slice of an `execFile` rejection the spawn record reads. */
interface ExecFailure {
  code?: unknown;
  signal?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  name?: unknown;
  message?: unknown;
}

/** What a failed child is recorded as: its exit code or signal when it ran, its spawn error when it did not. */
export function spawnOutcomeOf(err: unknown): SpawnEnd {
  const failure = (typeof err === 'object' && err !== null ? err : {}) as ExecFailure;
  const exitCode = typeof failure.code === 'number' ? failure.code : undefined;
  const signal = typeof failure.signal === 'string' ? failure.signal : undefined;
  const message = typeof failure.message === 'string' ? failure.message : String(err);
  return {
    ok: false,
    ...(exitCode !== undefined ? { exitCode } : {}),
    ...(signal !== undefined ? { signal } : {}),
    // The spawn itself failed (ENOENT: the binary is not there) or the child
    // died without a code or a signal: the error is the only account.
    ...(exitCode === undefined && signal === undefined
      ? { error: { name: typeof failure.code === 'string' ? failure.code : typeof failure.name === 'string' ? failure.name : 'Error', message } }
      : {}),
    stdout: typeof failure.stdout === 'string' ? failure.stdout : '',
    stderr: typeof failure.stderr === 'string' ? failure.stderr : '',
  };
}

/**
 * Runs a child process with retries. The one seam every child the server
 * runs goes through (spec 013): each attempt is a sub-operation of the
 * request it serves — argv, exit code, captured streams — through the
 * request scope, or a server-rank line when no request is in hand.
 * @issue DTX-6134: `execFile`, not `exec` — arguments go to the kernel as argv, never through a shell.
 */
export async function execWithRetries(opts: ExecOpts): Promise<ExecResult> {
  const { file, args, retries = 0, retryInterval = 1000, signal, timeout, env } = opts;
  const tool = toolNameOf(file, args);
  // Once, here, for every trace: presigned links and credentials on an argv never reach a log line.
  const argv = redactArgv([file, ...args]);

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const span = spawnTrace().beginSpawn({ tool, argv, attempt: attempt + 1 });
    try {
      const { stdout, stderr } = await execFileAsync(file, [...args], {
        signal,
        timeout,
        maxBuffer: MAX_BUFFER_BYTES,
        ...(env ? { env: { ...process.env, ...env } } : {}),
      });
      span.end({ ok: true, exitCode: 0, stdout, stderr });
      return {
        stdout: stdout.replaceAll('\r\n', '\n'),
        stderr: stderr.replaceAll('\r\n', '\n'),
      };
    } catch (err) {
      span.end(spawnOutcomeOf(err));
      lastError = err instanceof Error ? err : new Error(String(err));
      // @issue DTX-6135: an abort is the caller's decision, not a transient failure — no retry after cancellation.
      // A deadline kill is the same kind of verdict: the tool wedged past its
      // ceiling, and re-running it would multiply that ceiling by the retry count.
      if (signal?.aborted || (err as { killed?: boolean } | null)?.killed === true) break;
    }

    if (attempt < retries) {
      const aborted = await setTimeout(retryInterval, false, { signal }).catch(() => true);
      if (aborted) break;
    }
  }

  throw lastError ?? new Error(`${file} produced no result and no error`);
}
