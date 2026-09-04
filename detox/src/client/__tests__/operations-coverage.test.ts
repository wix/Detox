import { describe, it, expect, vi } from 'vitest';

import type { DetoxOperationEndEvent, DetoxOperationRef, DetoxProgressEvent } from '../../client';
import { OperationImpl, OperationRegistry } from '../operations';

/**
 * Fills in the tail `operations.ts` left uncovered by `abort-cause.test.ts`
 * and `listeners.test.ts`: unsubscription (`off`), the child registry
 * (`child`/`adoptChild`/`beginChild`), promise delegation (`finally`,
 * `Symbol.toStringTag`), `offOperation`, and the synchronous-throw path of
 * `OperationRegistry.run`.
 */

function progressEvent(op: OperationImpl<unknown>): DetoxProgressEvent {
  return {
    type: 'progress',
    name: op.name,
    operation: op,
    timestamp: Date.now(),
  } as DetoxProgressEvent;
}

describe('OperationImpl.off', () => {
  it('stops a progress listener from receiving further events', () => {
    const op = new OperationImpl<void>({ id: 'op-1', name: 'boot' });
    const seen: string[] = [];
    const listener = (event: DetoxProgressEvent) => seen.push(event.name);

    op.on('progress', listener);
    op.dispatchProgress(progressEvent(op));
    expect(seen).toEqual(['boot']);

    op.off('progress', listener);
    op.dispatchProgress(progressEvent(op));
    // Unchanged: the unsubscribed listener saw nothing further.
    expect(seen).toEqual(['boot']);
  });

  it('stops an end listener from receiving the terminal event', () => {
    const op = new OperationImpl<void>({ id: 'op-2', name: 'boot' });
    const listener = vi.fn<(event: DetoxOperationEndEvent) => void>();

    op.on('end', listener);
    op.off('end', listener);
    op.settle({ ok: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it('leaves other subscribers of the same event alone', () => {
    const op = new OperationImpl<void>({ id: 'op-3', name: 'boot' });
    const removed = vi.fn();
    const kept = vi.fn();
    op.on('end', removed);
    op.on('end', kept);

    op.off('end', removed);
    op.settle({ ok: true });

    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledTimes(1);
  });
});

describe('OperationImpl parent/child bookkeeping', () => {
  it('child() returns undefined until one is adopted, then returns it by name', () => {
    const parent = new OperationImpl<void>({ id: 'op-4', name: 'allocateDevice' });
    expect(parent.child('boot')).toBeUndefined();

    const child = new OperationImpl<void>({ id: 'op-4-1', name: 'boot' });
    parent.adoptChild(child);

    expect(parent.child('boot')).toBe(child);
  });
});

describe('OperationImpl promise delegation', () => {
  it('finally() runs after settlement and passes the value through', async () => {
    const op = new OperationImpl<string>({ id: 'op-5', name: 'boot' });
    const order: string[] = [];
    op.adoptPromise(
      Promise.resolve('done').then((v) => {
        order.push('resolved');
        return v;
      }),
    );

    const result = await op.finally(() => order.push('cleanup'));

    expect(result).toBe('done');
    expect(order).toEqual(['resolved', 'cleanup']);
  });

  it('finally() still runs, without swallowing the rejection, when the inner promise rejects', async () => {
    const op = new OperationImpl<string>({ id: 'op-6', name: 'boot' });
    const boom = new Error('boom');
    op.adoptPromise(Promise.reject(boom));
    const cleanup = vi.fn();

    await expect(op.finally(cleanup)).rejects.toBe(boom);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('delegates catch() to the inner promise', async () => {
    const op = new OperationImpl<string>({ id: 'op-6b', name: 'boot' });
    const boom = new Error('boom');
    op.adoptPromise(Promise.reject(boom));

    const recovered = await op.catch((reason) => `recovered from: ${(reason as Error).message}`);

    expect(recovered).toBe('recovered from: boom');
  });

  it('identifies itself as a DetoxOperation via Symbol.toStringTag', () => {
    const op = new OperationImpl<void>({ id: 'op-7', name: 'boot' });
    expect(Object.prototype.toString.call(op)).toBe('[object DetoxOperation]');
  });
});

describe('OperationRegistry.offOperation', () => {
  it('stops delivering to an unsubscribed listener while others keep receiving', () => {
    const registry = new OperationRegistry();
    const seenByA: string[] = [];
    const seenByB: string[] = [];
    const listenerA = (op: DetoxOperationRef) => seenByA.push(op.name);
    const listenerB = (op: DetoxOperationRef) => seenByB.push(op.name);

    registry.onOperation(listenerA);
    registry.onOperation(listenerB);
    registry.run<void>('boot', { execute: () => Promise.resolve() });
    expect(seenByA).toEqual(['boot']);
    expect(seenByB).toEqual(['boot']);

    registry.offOperation(listenerA);
    registry.run<void>('shutdown', { execute: () => Promise.resolve() });

    expect(seenByA).toEqual(['boot']);
    expect(seenByB).toEqual(['boot', 'shutdown']);
  });
});

describe('OperationRegistry.run — synchronous throw from execute', () => {
  it('rejects the operation rather than crashing the caller', async () => {
    const registry = new OperationRegistry();
    const boom = new Error('execute blew up synchronously');

    const op = registry.run<void>('boot', {
      execute: () => {
        throw boom;
      },
    });

    await expect(op).rejects.toBe(boom);
  });

  it('wraps a non-Error throw in an Error so downstream .message access is safe', async () => {
    const registry = new OperationRegistry();

    const op = registry.run<void>('boot', {
      execute: () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'a string thrown, not an Error';
      },
    });

    await expect(op).rejects.toThrow('a string thrown, not an Error');
  });
});

describe('OperationRegistry.beginChild', () => {
  it('adopts the child under the parent and announces it on the operation channel', () => {
    const registry = new OperationRegistry();
    const announced: string[] = [];
    registry.onOperation((op) => announced.push(op.name));

    const parent = registry.run<void>('allocateDevice', { execute: () => Promise.resolve() });
    const child = registry.beginChild('boot', parent);

    expect(parent.child('boot')).toBe(child);
    expect(announced).toEqual(['allocateDevice', 'boot']);
  });

  it("composes the child's signal from the parent's, so aborting the parent aborts the child", () => {
    const registry = new OperationRegistry();
    const parent = registry.run<void>('allocateDevice', { execute: () => Promise.resolve() });
    const child = registry.beginChild('boot', parent);
    const reason = new Error('parent gave up');

    parent.abort(reason);

    expect(child.signal.aborted).toBe(true);
    expect(child.signal.reason).toBe(reason);
  });

  /**
   * @issue DTX-3005
   * A child operation begun via `beginChild` (e.g. the implicit boot
   * inside `allocateDevice`) has no wire request of its own to cancel, so
   * aborting it escalates to whoever owns the parent's wire call.
   */
  it("escalates an abort on the child to the parent, since the child owns no wire request of its own", () => {
    const registry = new OperationRegistry();
    const parent = registry.run<void>('allocateDevice', {
      execute: () => new Promise<void>(() => {}), // stays pending
    });
    const child = registry.beginChild('boot', parent);
    const reason = new Error('give up on just the child');

    child.abort(reason);

    expect(parent.signal.aborted).toBe(true);
    expect(parent.signal.reason).toBe(reason);
  });
});
