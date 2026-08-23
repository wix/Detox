import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

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
   * forwards those to the app process, not to simctl itself.
   */
  env?: Readonly<Record<string, string>>;
}

/**
 * Runs a child process with retries.
 * @issue DTX-6134: `execFile`, not `exec` — arguments go to the kernel as argv, never through a shell.
 */
export async function execWithRetries(opts: ExecOpts): Promise<ExecResult> {
  const { file, args, retries = 0, retryInterval = 1000, signal, timeout, env } = opts;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { stdout, stderr } = await execFileAsync(file, [...args], {
        signal,
        timeout,
        maxBuffer: MAX_BUFFER_BYTES,
        ...(env ? { env: { ...process.env, ...env } } : {}),
      });
      return {
        stdout: stdout.replaceAll('\r\n', '\n'),
        stderr: stderr.replaceAll('\r\n', '\n'),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // @issue DTX-6135: an abort is the caller's decision, not a transient failure — no retry after cancellation.
      if (signal?.aborted) break;
    }

    if (attempt < retries) {
      const aborted = await setTimeout(retryInterval, false, { signal }).catch(() => true);
      if (aborted) break;
    }
  }

  throw lastError ?? new Error(`${file} produced no result and no error`);
}
