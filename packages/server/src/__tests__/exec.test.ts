import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { execWithRetries, spawnOutcomeOf } from '../exec';
import { requestScope, type RequestTrace, type SpawnBegin, type SpawnEnd } from '../request-scope';

/**
 * @issue DTX-6134
 * `device.model` arrives from the client. `execFile` sends arguments to
 * the kernel as an argv array, never through a shell — interpolating a
 * client-supplied string into a shell command would be remote code
 * execution as the server user.
 */
describe('execWithRetries', () => {
  const canary = join(tmpdir(), 'detox-exec-injection-canary');

  afterEach(() => {
    rmSync(canary, { force: true });
  });

  it('passes shell metacharacters through as literal argument text', async () => {
    const hostile = `x" ; touch ${canary} ; echo "`;

    const result = await execWithRetries({ file: '/bin/echo', args: [hostile] });

    expect(result.stdout.trim()).toBe(hostile);
    expect(existsSync(canary)).toBe(false);
  });

  it('does not let a single argument split into several', async () => {
    // Under a shell this would be three arguments; as argv it is one.
    const result = await execWithRetries({ file: '/bin/echo', args: ['a b c'] });
    expect(result.stdout).toBe('a b c\n');
  });

  /**
   * @issue DTX-6135
   * An abort is the caller's decision, not a transient failure — no
   * retry after cancellation. The assertion here is on elapsed time
   * rather than on "it rejected", because rejecting is what a version
   * with no abort handling at all would also do, eventually, five retry
   * intervals later. The project's frozen constraint is that
   * cancellation reaches the child processes; an abort that
   * takes 50 seconds to be noticed does not.
   */
  it('gives up immediately on abort instead of sleeping out its retries', async () => {
    const controller = new AbortController();
    controller.abort();

    const startedAt = Date.now();
    await expect(
      execWithRetries({
        file: '/bin/echo',
        args: ['hi'],
        signal: controller.signal,
        retries: 5,
        retryInterval: 10_000,
      }),
    ).rejects.toThrow();

    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });

  it('honours a timeout so a wedged child cannot hang its caller', async () => {
    await expect(
      execWithRetries({ file: '/bin/sleep', args: ['30'], timeout: 100 }),
    ).rejects.toThrow();
  });

  /**
   * A deadline kill is a verdict that the tool wedged, not a transient
   * failure: retrying it would multiply the ceiling by the retry count
   * (`simctl boot` runs with `retries: 10`). Bounded well under one retry
   * interval — proof the kill ended the schedule, not just one attempt.
   */
  it('does not retry a child its own deadline killed', async () => {
    const startedAt = Date.now();
    await expect(
      execWithRetries({ file: '/bin/sleep', args: ['30'], timeout: 100, retries: 5, retryInterval: 10_000 }),
    ).rejects.toThrow();
    expect(Date.now() - startedAt).toBeLessThan(2_000);
  });

  /**
   * An abort that lands *between* retries — not before the call, not during
   * a live child — must still cut the retry schedule short rather than sleep
   * out `retryInterval`. This is the other half of the "gives up immediately
   * on abort" contract above: that test aborts before attempt 0 even starts;
   * this one aborts while attempt 0 has already failed and the loop is
   * sitting in its inter-attempt backoff.
   */
  it('cuts a live retry backoff short when the caller aborts mid-wait', async () => {
    const controller = new AbortController();
    const startedAt = Date.now();

    const promise = execWithRetries({
      // A file that does not exist fails fast (ENOENT) without ever spawning
      // a real child, so attempt 0 is guaranteed to fail quickly and land the
      // loop in its retry-interval wait.
      file: '/bin/this-does-not-exist-detox-exec-test',
      args: [],
      signal: controller.signal,
      retries: 3,
      retryInterval: 5_000,
    });
    setTimeout(() => controller.abort(), 20);

    await expect(promise).rejects.toThrow();
    // Bounded well under the 5s retry interval — proof the abort actually cut
    // the wait short instead of the promise merely resolving on its own.
    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });
});

/**
 * Spec 013: every attempt is a spawn span on the request scope's trace —
 * tool name, argv verbatim, attempt number; a healthy end with exit code
 * 0 and the streams; a failed end with the exit code (or the spawn error
 * for a binary that is not there); each retry its own span.
 */
describe('execWithRetries — the spawn spans (spec 013)', () => {
  interface Span {
    begin: SpawnBegin;
    end?: SpawnEnd;
  }
  function tracing() {
    const spans: Span[] = [];
    const trace: RequestTrace = {
      beginSpawn: (begin) => {
        const span: Span = { begin };
        spans.push(span);
        return {
          end: (outcome) => {
            span.end = outcome;
          },
        };
      },
      line: () => undefined,
    };
    return { spans, trace };
  }

  it('records a healthy child with its argv, exit code 0 and its streams', async () => {
    const { spans, trace } = tracing();
    await requestScope.run(trace, () => execWithRetries({ file: '/bin/echo', args: ['hello'] }));
    expect(spans).toHaveLength(1);
    expect(spans[0].begin).toEqual({ tool: 'echo', argv: ['/bin/echo', 'hello'], attempt: 1 });
    expect(spans[0].end).toEqual({ ok: true, exitCode: 0, stdout: 'hello\n', stderr: '' });
  });

  it('records a failing child with its exit code, and a missing binary with the spawn error, one span per attempt', async () => {
    const { spans, trace } = tracing();
    await expect(
      requestScope.run(trace, () => execWithRetries({ file: '/usr/bin/false', args: [], retries: 1, retryInterval: 1 })),
    ).rejects.toThrow();
    expect(spans.map((s) => s.begin.attempt)).toEqual([1, 2]);
    expect(spans[0].end).toMatchObject({ ok: false, exitCode: 1 });
    expect(spans[0].end).not.toHaveProperty('error');

    await expect(requestScope.run(trace, () => execWithRetries({ file: '/no/such/binary', args: ['x'] }))).rejects.toThrow();
    expect(spans[2].begin).toEqual({ tool: 'binary', argv: ['/no/such/binary', 'x'], attempt: 1 });
    expect(spans[2].end).toMatchObject({ ok: false, error: { name: 'ENOENT' } });
    expect(spans[2].end).not.toHaveProperty('exitCode');
  });

  it('names an xcrun child by its subcommand', async () => {
    const { spans, trace } = tracing();
    await expect(requestScope.run(trace, () => execWithRetries({ file: '/no/such/xcrun', args: ['simctl', 'list'] }))).rejects.toThrow();
    expect(spans[0].begin).toEqual({ tool: 'simctl', argv: ['/no/such/xcrun', 'simctl', 'list'], attempt: 1 });
    expect(spans[0].end).toMatchObject({ ok: false, error: { name: 'ENOENT' } });
  });

  it('redacts a gateway claim URL on the argv before the span sees it', async () => {
    const { spans, trace } = tracing();
    await requestScope.run(trace, () => execWithRetries({ file: '/bin/echo', args: ['-detoxServer', 'ws://127.0.0.1:1/nonce', 'https://u:p@h/x?s=1'] }));
    expect(spans[0].begin.argv).toEqual(['/bin/echo', '-detoxServer', 'ws://127.0.0.1:1/…', 'https://h/x']);
  });

  it('spawnOutcomeOf reads a killed child and a bare throw', () => {
    expect(spawnOutcomeOf({ code: null, signal: 'SIGTERM', stdout: 'so', stderr: 'se', message: 'killed' })).toEqual({ ok: false, signal: 'SIGTERM', stdout: 'so', stderr: 'se' });
    expect(spawnOutcomeOf('boom')).toEqual({ ok: false, error: { name: 'Error', message: 'boom' }, stdout: '', stderr: '' });
  });
});
