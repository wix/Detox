import { describe, it, expect } from 'vitest';

import { OperationRegistry } from '../operations';

/**
 * @issue DTX-3006
 * When an operation's own signal is already aborted, any rejection racing it
 * is the cancellation. The real failure is not discarded: it survives on the
 * `AbortError` at `details.displaced`, never mutated onto the abort reason's
 * own `.cause` — the reason object is often shared (e.g. one
 * `AbortSignal.any` composition backing several operations) and sometimes
 * frozen. A rejection that is already an `AbortError` passes through
 * untouched.
 */
describe('a rejection displaced by an abort', () => {
  it('keeps the abort reason as .cause and the real failure in details.displaced', async () => {
    const registry = new OperationRegistry();
    const reason = new Error('give up');
    const displaced = new Error('the real failure that raced the abort');

    const operation = registry.run<void>('allocateDevice', {
      execute: (op) => {
        op.abort(reason);
        return Promise.reject(displaced);
      },
    });

    let err: (Error & { cause?: unknown; details?: { displaced?: unknown } }) | undefined;
    await operation.catch((e: unknown) => {
      err = e as typeof err;
    });

    expect(err?.name).toBe('AbortError');
    expect(err?.cause).toBe(reason);
    expect(err?.details?.displaced).toBe(displaced);
  });

  it('leaves a rejection that is already an AbortError alone', async () => {
    const registry = new OperationRegistry();
    const reason = new Error('give up');
    const alreadyAbort = new Error('Aborted');
    alreadyAbort.name = 'AbortError';

    const operation = registry.run<void>('allocateDevice', {
      execute: (op) => {
        op.abort(reason);
        return Promise.reject(alreadyAbort);
      },
    });

    let err: Error | undefined;
    await operation.catch((e: unknown) => {
      err = e as Error;
    });

    expect(err).toBe(alreadyAbort);
  });

  it('never touches the reason object, even when it is frozen', async () => {
    const registry = new OperationRegistry();
    const reason = Object.freeze(new Error('give up — frozen'));
    const displaced = new Error('the real failure');

    const operation = registry.run<void>('allocateDevice', {
      execute: (op) => {
        op.abort(reason);
        return Promise.reject(displaced);
      },
    });

    const ended = new Promise<void>((resolve) => {
      operation.on('end', () => resolve());
    });

    let err: (Error & { cause?: unknown; details?: { displaced?: unknown } }) | undefined;
    await operation.catch((e: unknown) => {
      err = e as typeof err;
    });
    await ended;

    expect(err?.name).toBe('AbortError');
    expect(err?.cause).toBe(reason);
    expect(err?.details?.displaced).toBe(displaced);
  });

  it('does not let one operation report another operation\'s failure when both share an abort reason', async () => {
    // `AbortSignal.any` — how a session signal composes into every operation
    // it started — hands every one of them the SAME reason object once it
    // fires. Two operations racing different failures against that one abort
    // must not cross-contaminate.
    const sessionController = new AbortController();
    const registry = new OperationRegistry(sessionController.signal);
    const reason = new Error('session gave up');
    const failureA = new Error('operation A failed for its own reason');
    const failureB = new Error('operation B failed for its own reason');

    const operationA = registry.run<void>('boot', { execute: () => Promise.reject(failureA) });
    const operationB = registry.run<void>('shutdown', { execute: () => Promise.reject(failureB) });
    sessionController.abort(reason);

    let errA: (Error & { details?: { displaced?: unknown } }) | undefined;
    let errB: (Error & { details?: { displaced?: unknown } }) | undefined;
    await Promise.all([
      operationA.catch((e: unknown) => {
        errA = e as typeof errA;
      }),
      operationB.catch((e: unknown) => {
        errB = e as typeof errB;
      }),
    ]);

    expect(errA?.details?.displaced).toBe(failureA);
    expect(errB?.details?.displaced).toBe(failureB);
  });

  it('still carries the displaced error even when the reason is a primitive with nowhere of its own to hold one', async () => {
    const registry = new OperationRegistry();
    const displaced = new Error('the real failure');

    const operation = registry.run<void>('allocateDevice', {
      execute: (op) => {
        op.abort('a plain string reason');
        return Promise.reject(displaced);
      },
    });

    let err: (Error & { cause?: unknown; details?: { displaced?: unknown } }) | undefined;
    await operation.catch((e: unknown) => {
      err = e as typeof err;
    });

    expect(err?.cause).toBe('a plain string reason');
    expect(err?.details?.displaced).toBe(displaced);
  });
});
