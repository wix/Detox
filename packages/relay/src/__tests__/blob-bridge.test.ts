/**
 * The hop-by-hop staging step (spec 008): HEAD the node, PUT from the
 * relay's own store on a miss, and every failure an outcome the session
 * turns into a typed 2016 — including the self-heal case (the relay's own
 * store evicted the blob) that the client's HEAD→PUT→retry round repairs.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';

import { describe, it, expect, vi } from 'vitest';

import { BlobStore } from '@detox-remote/server';

import { ensureBlobOnNode, type BlobLanePort } from '../blob-bridge';

const BYTES = Buffer.from('spec 008 build bytes');
const HEX = createHash('sha256').update(BYTES).digest('hex');

async function storeWithBlob(): Promise<BlobStore> {
  const store = await BlobStore.open({
    root: mkdtempSync(path.join(tmpdir(), 'relay-bridge-test-')),
    logPrefix: '[relay]',
  });
  await store.put(HEX, Readable.from(BYTES), BYTES.length);
  return store;
}

interface LaneScript {
  headStatus?: number | Error;
  putStatus?: number | Error;
}

interface RecordedPut {
  hex: string;
  bytes?: number;
}

interface ScriptedLane {
  lane: BlobLanePort;
  heads: string[];
  puts: RecordedPut[];
}

function scriptedLane(script: LaneScript): ScriptedLane {
  const heads: string[] = [];
  const puts: RecordedPut[] = [];
  return {
    heads,
    puts,
    lane: {
      head: (hex) => {
        heads.push(hex);
        const outcome = script.headStatus ?? 404;
        return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
      },
      put: (hex, options) => {
        puts.push({ hex, bytes: options.bytes });
        const outcome = script.putStatus ?? 201;
        return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
      },
    },
  };
}

describe('ensureBlobOnNode', () => {
  it('a node that already holds the bytes gets no push — the dedup story, one hop up', async () => {
    const store = await storeWithBlob();
    const { lane, puts } = scriptedLane({ headStatus: 200 });
    expect(await ensureBlobOnNode({ lane, store }, HEX)).toEqual({ ok: true });
    expect(puts).toHaveLength(0);
  });

  it('pushes from the relay store exactly once on a miss, with the real byte length', async () => {
    const store = await storeWithBlob();
    const { lane, puts } = scriptedLane({ headStatus: 404, putStatus: 201 });
    expect(await ensureBlobOnNode({ lane, store }, HEX)).toEqual({ ok: true });
    expect(puts).toEqual([{ hex: HEX, bytes: BYTES.length }]);
  });

  it('an idempotent 200 re-PUT also counts as staged', async () => {
    const store = await storeWithBlob();
    const { lane } = scriptedLane({ headStatus: 404, putStatus: 200 });
    expect((await ensureBlobOnNode({ lane, store }, HEX)).ok).toBe(true);
  });

  it('the self-heal case: relay store no longer holds the blob → a reason naming the re-upload', async () => {
    const store = await BlobStore.open({
      root: mkdtempSync(path.join(tmpdir(), 'relay-bridge-empty-')),
      logPrefix: '[relay]',
    });
    const { lane, puts } = scriptedLane({ headStatus: 404 });
    const outcome = await ensureBlobOnNode({ lane, store }, HEX);
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toMatch(/re-upload/);
    expect(puts).toHaveLength(0);
  });

  it.each([
    ['an unreachable lane on HEAD', { headStatus: new Error('ECONNREFUSED') }, /could not be reached/],
    ['a strange HEAD status', { headStatus: 507 }, /HTTP 507/],
    ['a refused push', { headStatus: 404, putStatus: 507 }, /refused the push/],
    ['a push dying mid-stream', { headStatus: 404, putStatus: new Error('socket hang up') }, /mid-stream/],
  ] as [string, LaneScript, RegExp][])('%s becomes a 2016-shaped outcome', async (_label, script, reason) => {
    const store = await storeWithBlob();
    const { lane } = scriptedLane(script);
    const outcome = await ensureBlobOnNode({ lane, store }, HEX);
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toMatch(reason);
  });

  /**
   * @issue DTX-7042
   * A wedge detector, not a patience limit: a node whose lane accepted the
   * socket and then moves no bytes is a wedged-alive process, the one
   * failure the socket itself can't report — a dead process fails fast
   * through the socket instead.
   */
  it('abandons a lane that accepted the socket and answers nothing — the wedge detector', async () => {
    vi.useFakeTimers();
    try {
      const store = await storeWithBlob();
      const lane: BlobLanePort = {
        // A wedged-alive node: the request is accepted, nothing ever answers.
        // Respecting the signal is what BlobLaneClient does for real.
        head: (_hex, signal) =>
          new Promise<number>((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          }),
        put: () => Promise.resolve(201),
      };
      const pending = ensureBlobOnNode({ lane, store }, HEX);
      await vi.advanceTimersByTimeAsync(31_000);
      const outcome = await pending;
      expect(outcome.ok).toBe(false);
      expect(outcome.reason).toMatch(/wedge detector/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('never leaves the entry pinned — a failed push must not exempt the blob from eviction forever', async () => {
    // A budget with room for exactly one blob: admitting a second must evict
    // the first — which is only possible if the failed push unpinned it.
    const store = await BlobStore.open({
      root: mkdtempSync(path.join(tmpdir(), 'relay-bridge-pin-')),
      budgetBytes: BYTES.length,
      logPrefix: '[relay]',
    });
    await store.put(HEX, Readable.from(BYTES), BYTES.length);
    const { lane } = scriptedLane({ headStatus: 404, putStatus: new Error('boom') });
    await ensureBlobOnNode({ lane, store }, HEX);

    const other = Buffer.from('spec 008 other bytes'); // same length as BYTES — exactly fills the budget
    const otherHex = createHash('sha256').update(other).digest('hex');
    // With HEX still pinned this would refuse (507: everything is pinned).
    await expect(store.put(otherHex, Readable.from(other), other.length)).resolves.toBe('stored');
    expect(store.has(HEX)).toBe(false);
  });
});
