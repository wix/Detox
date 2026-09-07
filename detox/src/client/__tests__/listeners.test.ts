import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { DetoxProgressEvent } from '../../client';
import { OperationRegistry } from '../operations';

/**
 * @issue DTX-3004
 * Reporters, IDE integrations and watchdogs are guests on these channels: a
 * reporter that throws on `end` must not turn a successful allocation into a
 * rejection (which also leaks the device), and one that throws on
 * `operation` must not make the call throw synchronously when the
 * documented contract is that operations reject. The throw is reported,
 * never propagated, never swallowed in silence.
 */
describe('a listener that throws', () => {
  beforeEach(() => {
    // The isolation is deliberately loud; the noise is not the test's subject.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not turn a successful operation into a failed one', async () => {
    const registry = new OperationRegistry();
    const operation = registry.run<string>('allocateDevice', {
      execute: () => Promise.resolve('the device'),
    });
    operation.on('end', () => {
      throw new Error('this reporter is broken');
    });

    await expect(operation).resolves.toBe('the device');
  });

  it('does not make the call throw synchronously from the operation channel', async () => {
    const registry = new OperationRegistry();
    registry.onOperation(() => {
      throw new Error('this reporter is broken');
    });

    const operation = registry.run<string>('allocateDevice', {
      execute: () => Promise.resolve('the device'),
    });

    await expect(operation).resolves.toBe('the device');
  });

  it('still reaches the listeners registered after it', () => {
    const registry = new OperationRegistry();
    const reached: string[] = [];
    registry.onOperation(() => {
      throw new Error('this reporter is broken');
    });
    registry.onOperation((op) => reached.push(op.name));

    registry.run<void>('allocateDevice', { execute: () => Promise.resolve() });

    expect(reached).toEqual(['allocateDevice']);
  });

  it('reports the throw rather than swallowing it', () => {
    const registry = new OperationRegistry();
    registry.onOperation(() => {
      throw new Error('this reporter is broken');
    });

    registry.run<void>('allocateDevice', { execute: () => Promise.resolve() });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('listener threw'),
      expect.any(Error),
    );
  });

  it('does not stop progress from reaching the rest of the tree', () => {
    const registry = new OperationRegistry();
    const seen: string[] = [];
    const parent = registry.run<void>('allocateDevice', { execute: () => Promise.resolve() });
    parent.on('progress', () => {
      throw new Error('this reporter is broken');
    });
    parent.on('progress', (event) => seen.push(event.name));

    // `DetoxProgressEvent` is a union discriminated by operation name, and the
    // registry's own emitter casts for the same reason: `parent.name` is only
    // known to be *some* operation name at this point.
    parent.dispatchProgress({
      type: 'progress',
      name: parent.name,
      operation: parent,
      timestamp: Date.now(),
    } as DetoxProgressEvent);

    expect(seen).toEqual(['allocateDevice']);
  });
});
