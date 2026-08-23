import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { execWithRetries } from '../exec';

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
